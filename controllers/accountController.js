// controllers/accountController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const accountController = {

  loginPage: (req, res) => {
    if (req.session.user) {
      const u = req.session.user;
      if (u.isadmin || u.issuperadmin) return res.redirect('/admin/dashboard');
      if (u.usertypeid === 3) return res.redirect('/employer/dashboard');
      return res.redirect('/user/dashboard');
    }
    res.render('account/login', { title: 'Login', layout: 'layouts/auth' });
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email only — no companyid filter so admin always works
      const user = await db('tbluser')
        .where('useremail', email.trim().toLowerCase())
        .where('isactive', 1)
        .first();

      if (!user) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      const isMatch = await bcrypt.compare(password, user.userpassword);
      if (!isMatch) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      // Store session
      req.session.user = {
        userid: user.userid,
        fname: user.fname,
        lname: user.lname,
        useremail: user.useremail,
        isadmin: !!user.isadmin,
        issuperadmin: !!user.issuperadmin,
        usertypeid: user.usertypeid,
        companyid: user.companyid
      };

      // Update login timestamp (ignore errors)
      await db('tbluser').where('userid', user.userid)
        .update({ islogin: 1, logindate: new Date() }).catch(() => {});

      req.flash('success_msg', `Welcome back, ${user.fname}!`);

      // Route by role
      if (user.isadmin || user.issuperadmin) {
        return res.redirect('/admin/dashboard');
      } else if (user.usertypeid === 3) {
        return res.redirect('/employer/dashboard');
      }
      return res.redirect('/user/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      req.flash('error_msg', 'Login failed: ' + err.message);
      res.redirect('/account/login');
    }
  },

  logout: async (req, res) => {
    if (req.session.user) {
      await db('tbluser').where('userid', req.session.user.userid)
        .update({ islogin: 0, logoutdate: new Date() }).catch(() => {});
    }
    req.session.destroy();
    res.redirect('/');
  },

  signupPage: (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('account/signup', { title: 'Register', layout: 'layouts/auth' });
  },

  signup: async (req, res) => {
    try {
      const { fname, lname, email, password, password2, mobile, role } = req.body;
      const companyId = parseInt(process.env.DEFAULT_COMPANY_ID) || 1;

      if (password !== password2) {
        req.flash('error_msg', 'Passwords do not match');
        return res.redirect('/account/signup');
      }

      if (password.length < 6) {
        req.flash('error_msg', 'Password must be at least 6 characters');
        return res.redirect('/account/signup');
      }

      // Check duplicate email
      const exists = await db('tbluser')
        .where('useremail', email.trim().toLowerCase())
        .first();
      if (exists) {
        req.flash('error_msg', 'Email already registered');
        return res.redirect('/account/signup');
      }

      const hashed = await bcrypt.hash(password, 10);
      const usertypeid = role === '3' ? 3 : 4; // 3=employer, 4=candidate

      await db('tbluser').insert({
        uuid: uuidv4(),
        fname: fname.trim(),
        lname: lname.trim(),
        useremail: email.trim().toLowerCase(),
        userpassword: hashed,
        mobile: mobile || null,
        usertypeid,
        
        isadmin: 0,
        issuperadmin: 0,
        isactive: 1,
        issignup: 1,
        islogin: 0,
        signupdate: new Date(),
        addeddate: new Date(),
        isdeleted: 0
      });

      req.flash('success_msg', 'Account created! Please login.');
      res.redirect('/account/login');
    } catch (err) {
      console.error('Signup error:', err);
      req.flash('error_msg', 'Registration failed: ' + err.message);
      res.redirect('/account/signup');
    }
  },

  forgotPasswordPage: (req, res) => res.render('account/forgot-password', { title: 'Forgot Password', layout: 'layouts/auth' }),

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await db('tbluser').where('useremail', email).where('isactive', true).first();
      if (!user) { req.flash('error_msg', 'Email not found'); return res.redirect('/account/forgot-password'); }

      const token = uuidv4();
      await db('tblforgotpassword').insert({
        uuid: uuidv4(), userid: user.userid, token,
        expirydate: new Date(Date.now() + 3600000), isused: false, addeddate: new Date()
      });
      // TODO: send email
      req.flash('success_msg', 'Reset link sent (check console): /account/reset-password/' + token);
      res.redirect('/account/login');
    } catch (err) {
      req.flash('error_msg', 'Failed'); res.redirect('/account/forgot-password');
    }
  },

  resetPasswordPage: async (req, res) => {
    const rec = await db('tblforgotpassword').where('token', req.params.token)
      .where('isused', false).where('expirydate', '>', new Date()).first();
    if (!rec) { req.flash('error_msg', 'Expired link'); return res.redirect('/account/login'); }
    res.render('account/reset-password', { title: 'Reset Password', token: req.params.token, layout: 'layouts/auth' });
  },

  resetPassword: async (req, res) => {
    try {
      const { token, password, password2 } = req.body;
      if (password !== password2) { req.flash('error_msg', 'Passwords do not match'); return res.redirect(`/account/reset-password/${token}`); }
      const rec = await db('tblforgotpassword').where('token', token).where('isused', false).where('expirydate', '>', new Date()).first();
      if (!rec) { req.flash('error_msg', 'Expired link'); return res.redirect('/account/login'); }
      await db('tbluser').where('userid', rec.userid).update({ userpassword: await bcrypt.hash(password, 10), updateddate: new Date() });
      await db('tblforgotpassword').where('forgotpasswordid', rec.forgotpasswordid).update({ isused: true, useddate: new Date() });
      req.flash('success_msg', 'Password reset!'); res.redirect('/account/login');
    } catch (err) {
      req.flash('error_msg', 'Failed'); res.redirect('/account/login');
    }
  },

  profilePage: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/account/login');
      const user = await db('tbluser').where('userid', req.session.user.userid).first();
      const candidate = await db('tblcandidate')

      let myJobs = [];
      if (user.usertypeid === 3 || user.isadmin) {
        myJobs = await db('tbljobpost as j')
          .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
          .leftJoin('tbljobapplication as a', 'j.jobid', 'a.jobid')
          .select('j.jobid', 'j.jobtitle', 'j.approvalstatus', 'j.isactive', 'j.addeddate',
                  'c.categoryname', db.raw('COUNT(a.applicationid) as appcount'))
          .where('j.postedby', user.userid).where('j.isdeleted', 0)
          .groupBy('j.jobid', 'j.jobtitle', 'j.approvalstatus', 'j.isactive', 'j.addeddate', 'c.categoryname')
          .orderBy('j.addeddate', 'desc').catch(() => []);
      }

      const approvalLabels = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
      res.render('account/profile', { title: 'My Profile', user, candidate, myJobs, approvalLabels, moment });
    } catch (err) {
      console.error('Profile error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { fname, lname, mobile } = req.body;
      await db('tbluser').where('userid', req.session.user.userid)
        .update({ fname, lname, mobile, updateddate: new Date() });
      req.session.user.fname = fname;
      req.session.user.lname = lname;
      req.flash('success_msg', 'Profile updated!');
      res.redirect('/account/profile');
    } catch (err) {
      req.flash('error_msg', 'Failed'); res.redirect('/account/profile');
    }
  }
};

module.exports = accountController;
