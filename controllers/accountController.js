// controllers/accountController.js - Authentication Controller
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const accountController = {
  // Login page
  loginPage: (req, res) => {
    if (req.session.user) {
      return res.redirect('/dashboard');
    }
    res.render('account/login', {
      title: 'Login',
      layout: 'layouts/auth'
    });
  },

  // Login submit
  login: async (req, res) => {
    try {
      const { email, password, rememberme } = req.body;

      // Find user
      const user = await db('tbluser')
        .where('useremail', email)
        .where('isactive', true)
        .whereNull('isdeleted')
        .orWhere('isdeleted', false)
        .first();

      if (!user) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.userpassword);
      if (!isMatch) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      // Create session
      req.session.user = {
        userid: user.userid,
        username: user.username,
        fname: user.fname,
        lname: user.lname,
        useremail: user.useremail,
        isadmin: user.isadmin,
        issuperadmin: user.issuperadmin,
        usertypeid: user.usertypeid,
        companyid: user.companyid
      };

      req.session.companyId = user.companyid;

      // Update login status
      await db('tbluser')
        .where('userid', user.userid)
        .update({
          islogin: true,
          logindate: new Date(),
          isrememberme: rememberme ? true : false
        });

      // Log activity
      await db('ActivityLog').insert({
        ActivityLog: 'User logged in',
        UserId: user.userid,
        CreatedDate: new Date(),
        companyid: user.companyid
      });

      req.flash('success_msg', 'Login successful!');
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      req.flash('error_msg', 'Login failed. Please try again.');
      res.redirect('/account/login');
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      if (req.session.user) {
        // Update logout time
        await db('tbluser')
          .where('userid', req.session.user.userid)
          .update({
            islogin: false,
            logoutdate: new Date()
          });

        // Log activity
        await db('ActivityLog').insert({
          ActivityLog: 'User logged out',
          UserId: req.session.user.userid,
          CreatedDate: new Date(),
          companyid: req.session.companyId
        });
      }

      req.session.destroy();
      req.flash('success_msg', 'Logged out successfully');
      res.redirect('/');
    } catch (error) {
      console.error('Logout error:', error);
      res.redirect('/');
    }
  },

  // Signup page
  signupPage: (req, res) => {
    res.render('account/signup', {
      title: 'Sign Up',
      layout: 'layouts/auth'
    });
  },

  // Signup submit
  signup: async (req, res) => {
    try {
      const { fname, lname, email, password, password2, mobile } = req.body;

      // Validation
      if (password !== password2) {
        req.flash('error_msg', 'Passwords do not match');
        return res.redirect('/account/signup');
      }

      // Check if user exists
      const existingUser = await db('tbluser')
        .where('useremail', email)
        .whereNull('isdeleted')
        .orWhere('isdeleted', false)
        .first();

      if (existingUser) {
        req.flash('error_msg', 'Email already registered');
        return res.redirect('/account/signup');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [userId] = await db('tbluser').insert({
        uuid: uuidv4(),
        fname: fname,
        lname: lname,
        useremail: email,
        userpassword: hashedPassword,
        mobile: mobile,
        usertypeid: 2, // Default user type
        companyid: process.env.DEFAULT_COMPANY_ID || 1,
        isactive: true,
        issignup: true,
        signupdate: new Date(),
        addeddate: new Date(),
        isdeleted: false
      });

      req.flash('success_msg', 'Registration successful! Please login.');
      res.redirect('/account/login');
    } catch (error) {
      console.error('Signup error:', error);
      req.flash('error_msg', 'Registration failed. Please try again.');
      res.redirect('/account/signup');
    }
  },

  // Forgot password page
  forgotPasswordPage: (req, res) => {
    res.render('account/forgot-password', {
      title: 'Forgot Password',
      layout: 'layouts/auth'
    });
  },

  // Forgot password submit
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await db('tbluser')
        .where('useremail', email)
        .where('isactive', true)
        .whereNull('isdeleted')
        .first();

      if (!user) {
        req.flash('error_msg', 'Email not found');
        return res.redirect('/account/forgot-password');
      }

      // Generate reset token
      const token = uuidv4();
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour

      await db('tblforgotpassword').insert({
        uuid: uuidv4(),
        userid: user.userid,
        token: token,
        expirydate: expiryDate,
        isused: false,
        addeddate: new Date()
      });

      // TODO: Send email with reset link
      // const resetLink = `${process.env.BASE_URL}/account/reset-password/${token}`;

      req.flash('success_msg', 'Password reset link sent to your email');
      res.redirect('/account/login');
    } catch (error) {
      console.error('Forgot password error:', error);
      req.flash('error_msg', 'Failed to process request');
      res.redirect('/account/forgot-password');
    }
  },

  // Reset password page
  resetPasswordPage: async (req, res) => {
    try {
      const { token } = req.params;

      const resetRecord = await db('tblforgotpassword')
        .where('token', token)
        .where('isused', false)
        .where('expirydate', '>', new Date())
        .first();

      if (!resetRecord) {
        req.flash('error_msg', 'Invalid or expired reset link');
        return res.redirect('/account/login');
      }

      res.render('account/reset-password', {
        title: 'Reset Password',
        token: token,
        layout: 'layouts/auth'
      });
    } catch (error) {
      console.error('Reset password page error:', error);
      res.redirect('/account/login');
    }
  },

  // Reset password submit
  resetPassword: async (req, res) => {
    try {
      const { token, password, password2 } = req.body;

      if (password !== password2) {
        req.flash('error_msg', 'Passwords do not match');
        return res.redirect(`/account/reset-password/${token}`);
      }

      const resetRecord = await db('tblforgotpassword')
        .where('token', token)
        .where('isused', false)
        .where('expirydate', '>', new Date())
        .first();

      if (!resetRecord) {
        req.flash('error_msg', 'Invalid or expired reset link');
        return res.redirect('/account/login');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      await db('tbluser')
        .where('userid', resetRecord.userid)
        .update({
          userpassword: hashedPassword,
          updateddate: new Date()
        });

      // Mark token as used
      await db('tblforgotpassword')
        .where('forgotpasswordid', resetRecord.forgotpasswordid)
        .update({
          isused: true,
          useddate: new Date()
        });

      req.flash('success_msg', 'Password reset successful! Please login.');
      res.redirect('/account/login');
    } catch (error) {
      console.error('Reset password error:', error);
      req.flash('error_msg', 'Failed to reset password');
      res.redirect('/account/login');
    }
  },

  // Profile page
  profilePage: async (req, res) => {
    try {
      const user = await db('tbluser')
        .where('userid', req.session.user.userid)
        .first();

      res.render('account/profile', {
        title: 'My Profile',
        user: user
      });
    } catch (error) {
      console.error('Profile page error:', error);
      res.redirect('/dashboard');
    }
  },

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const { fname, lname, mobile, address } = req.body;

      await db('tbluser')
        .where('userid', req.session.user.userid)
        .update({
          fname: fname,
          lname: lname,
          mobile: mobile,
          address: address,
          updateddate: new Date()
        });

      // Update session
      req.session.user.fname = fname;
      req.session.user.lname = lname;

      req.flash('success_msg', 'Profile updated successfully');
      res.redirect('/account/profile');
    } catch (error) {
      console.error('Update profile error:', error);
      req.flash('error_msg', 'Failed to update profile');
      res.redirect('/account/profile');
    }
  }
};

module.exports = accountController;
