// controllers/frontController.js — MySQL compatible
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const moment = require('moment');

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resumes');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|doc|docx)$/i.test(file.originalname);
    cb(ok ? null : new Error('PDF/DOC/DOCX only'), ok);
  }
});

// ─── Tree helper ──────────────────────────────────────────────────────────────
function buildTree(items, parentId = null) {
  return items
    .filter(i => i.parent_id === parentId)
    .map(i => ({ ...i, children: buildTree(items, i.categoryid) }));
}

const frontController = {

  // ── HOME ──────────────────────────────────────────────────────────────────
  home: async (req, res) => {
    try {
      const jobs = await db('tbljobpost as j')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .leftJoin('tbluser as u', 'u.userid', 'j.postedby')
        .select('j.jobid','j.jobtitle','j.expstart','j.expend','j.salarystart','j.salaryend',
                'j.jobtype','j.addeddate','c.categoryname',
                db.raw("CONCAT(u.fname,' ',IFNULL(u.lname,'')) as postername"))
        .where('j.isdeleted', 0).where('j.approvalstatus', 1).where('j.isactive', 1)
        .orderBy('j.addeddate', 'desc').limit(6);

      const categories = await db('tbljobcategory as c')
        .leftJoin('tbljobpost as j', function() {
          this.on('j.categoryid','c.categoryid').andOn(db.raw('j.isactive = 1')).andOn(db.raw('j.isdeleted = 0'));
        })
        .select('c.categoryid', 'c.categoryname', db.raw('COUNT(j.jobid) as jobcount'))
        .where('c.isdeleted', 0).where('c.isactive', 1).whereNull('c.parent_id')
        .groupBy('c.categoryid','c.categoryname').orderBy('jobcount', 'desc').limit(12);

      const [jobCount]  = await db('tbljobpost').where('isdeleted',0).where('approvalstatus',1).count('jobid as cnt');
      const [catCount]  = await db('tbljobcategory').where('isdeleted',0).where('isactive',1).count('categoryid as cnt');
      const [appCount]  = await db('tbljobapplication').where('isdeleted',0).count('applicationid as cnt');
      const stats = {
        jobs: Number(jobCount.cnt), categories: Number(catCount.cnt), applications: Number(appCount.cnt)
      };

      res.render('front/home', { title: 'Find Your Dream Job', jobs, categories, stats, moment });
    } catch (err) {
      console.error('Home error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── CATEGORY BROWSE ───────────────────────────────────────────────────────
  categoryBrowse: async (req, res) => {
    try {
      const parentId  = req.params.id ? parseInt(req.params.id) : null;

      let currentCat = null, breadcrumb = [];
      if (parentId) {
        currentCat = await db('tbljobcategory').where('categoryid', parentId).first();
        if (!currentCat) return res.status(404).render('error/404', { title: 'Not Found' });
        if (currentCat.path) {
          const ids = currentCat.path.split('/').filter(Boolean).map(Number);
          if (ids.length) breadcrumb = await db('tbljobcategory').whereIn('categoryid', ids).orderBy('depth');
        }
        breadcrumb.push(currentCat);
      }

      const subCats = await db('tbljobcategory as c')
        .leftJoin('tbljobpost as j', function(){
          this.on('j.categoryid','c.categoryid').andOn(db.raw('j.isactive=1')).andOn(db.raw('j.isdeleted=0'));
        })
        .where('c.parent_id', parentId)
        .select('c.*', db.raw('COUNT(j.jobid) as jobcount'))
        .groupBy('c.categoryid').orderBy('c.sort_order').orderBy('c.categoryname');

      const isLeaf = subCats.length === 0 && parentId !== null;
      let jobs = [];
      if (isLeaf) {
        jobs = await db('tbljobpost as j')
          .leftJoin('tblcity as ct', 'ct.id', 'j.jobcity')
          .select('j.*', 'ct.name as cityname')
          .where('j.categoryid', parentId).where('j.isactive', 1)
          .where('j.isdeleted', 0).where('j.approvalstatus', 1)
          .orderBy('j.addeddate', 'desc');
      }

      const jobTypeMap = { 1:'Full-time', 2:'Part-time', 3:'Contract', 4:'Internship' };
      res.render('front/category', {
        title: currentCat ? currentCat.categoryname : 'Job Categories',
        currentCat, subCats, breadcrumb, jobs, isLeaf, jobTypeMap, moment
      });
    } catch (err) {
      console.error('categoryBrowse error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── JOB DETAIL ────────────────────────────────────────────────────────────
  jobDetail: async (req, res) => {
    try {
      const job = await db('tbljobpost as j')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .leftJoin('tblcity as ct', 'ct.id', 'j.jobcity')
        .select('j.*', 'c.categoryname', 'c.path as catpath', 'ct.name as cityname')
        .where('j.isactive', 1).where('j.approvalstatus', 1).first();
      if (!job) return res.status(404).render('error/404', { title: 'Job Not Found' });

      let breadcrumb = [];
      if (job.catpath) {
        const ids = job.catpath.split('/').filter(Boolean).map(Number);
        if (ids.length) breadcrumb = await db('tbljobcategory').whereIn('categoryid', ids).orderBy('depth');
      }
      if (job.categoryid) {
        const leafCat = await db('tbljobcategory').where('categoryid', job.categoryid).first();
        if (leafCat) breadcrumb.push(leafCat);
      }

      const jobTypeMap = { 1:'Full-time', 2:'Part-time', 3:'Contract', 4:'Internship' };
      res.render('front/job-detail', { title: job.jobtitle, job, breadcrumb, jobTypeMap, moment });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── APPLY FORM ────────────────────────────────────────────────────────────
  applyForm: async (req, res) => {
    try {
      const jobId = req.query.job ? parseInt(req.query.job) : null;
      let job = null;

      if (jobId) {
        job = await db('tbljobpost as j')
          .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
          .leftJoin('tblcity as ct', 'ct.id', 'j.jobcity')
          .select('j.*', 'c.categoryname', 'ct.name as cityname')
      }

      let candidate = null;
      if (req.session.user) {
        candidate = await db('tblcandidate')
      }

      res.render('front/apply-form', {
        title: job ? `Apply – ${job.jobtitle}` : 'Submit Your Resume',
        job, candidate, currentUser: req.session.user || null
      });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── APPLY SUBMIT (with file upload) ──────────────────────────────────────
  applySubmit: [
    upload.single('resume'),
    async (req, res) => {
      try {
        const {
          jobid, fullname, email, mobile, currentlocation,
          expyear, expmonth, currentsalary, expectedsalary,
          noticeperiod, reasonforchange, skills, qualification, coverletter
        } = req.body;

        if (!fullname || !email) {
          return res.json({ statusCode: 400, msg: 'Name and email are required' });
        }

        // File path for resume
        const resumepath = req.file ? '/uploads/resumes/' + req.file.filename : null;
        const jobidInt   = jobid ? parseInt(jobid) : null;

        // ── Insert job application if job specified ────────────────────────
        if (jobidInt) {
          // Check duplicate
          const existing = await db('tbljobapplication')
            .where('email', email.trim().toLowerCase()).where('jobid', jobidInt).where('isdeleted', 0).first();
          if (existing) {
            return res.json({ statusCode: 400, msg: 'You have already applied for this job.' });
          }

          await db('tbljobapplication').insert({
            uuid:           uuidv4(),
            jobid:          jobidInt,
            candidateuserid: req.session.user ? req.session.user.userid : null,
            fullname:       fullname.trim(),
            email:          email.trim().toLowerCase(),
            mobile:         mobile || null,
            currentlocation: currentlocation || null,
            expyear:        parseInt(expyear) || 0,
            expmonth:       parseInt(expmonth) || 0,
            currentsalary:  currentsalary || null,
            expectedsalary: expectedsalary || null,
            noticeperiod:   parseInt(noticeperiod) || 0,
            reasonforchange: reasonforchange || null,
            skills:         skills || null,
            qualification:  qualification || null,
            coverletter:    coverletter || null,
            resumepath:     resumepath,
            
            status:         0,
            isshortlisted:  0,
            isactive:       1,
            isdeleted:      0,
            addeddate:      new Date(),
            addedby:        req.session.user ? req.session.user.userid : null
          });
        }

        // ── Upsert candidate profile ──────────────────────────────────────
        const existing = await db('tblcandidate')

        if (!existing) {
          await db('tblcandidate').insert({
            uuid:           uuidv4(),
            userid:         req.session.user ? req.session.user.userid : null,
            candidatename:  fullname.trim(),
            candidateemail: email.trim().toLowerCase(),
            candidatemobile: mobile || null,
            expyear:        parseInt(expyear) || 0,
            expmonth:       parseInt(expmonth) || 0,
            currentsalary:  currentsalary || null,
            expectedsalary: expectedsalary || null,
            noticeperiod:   parseInt(noticeperiod) || 0,
            skills:         skills || null,
            qualification:  qualification || null,
            resumepath:     resumepath,
            
            isactive:       1,
            isdeleted:      0,
            addeddate:      new Date()
          });
        } else {
          await db('tblcandidate').where('candidateid', existing.candidateid).update({
            candidatename:   fullname.trim(),
            candidatemobile: mobile || null,
            expyear:        parseInt(expyear) || 0,
            expmonth:       parseInt(expmonth) || 0,
            currentsalary:  currentsalary || null,
            expectedsalary: expectedsalary || null,
            skills:         skills || null,
            qualification:  qualification || null,
            resumepath:     resumepath || existing.resumepath,
            userid:         req.session.user ? req.session.user.userid : existing.userid,
            updateddate:    new Date()
          });
        }

        res.json({ statusCode: 200, msg: jobidInt ? 'Application submitted successfully!' : 'Resume saved! We will contact you soon.' });
      } catch (err) {
        console.error('applySubmit error:', err);
        res.json({ statusCode: 500, msg: 'Submission failed: ' + err.message });
      }
    }
  ],

  // ── USER DASHBOARD (front user) ───────────────────────────────────────────
  userDashboard: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/account/login');
      const userId    = req.session.user.userid;

      // Applications this user submitted
      const myApps = await db('tbljobapplication as a')
        .join('tbljobpost as j', 'a.jobid', 'j.jobid')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .select('a.applicationid', 'a.fullname', 'a.email', 'a.addeddate',
                'a.status', 'a.resumepath', 'j.jobtitle', 'c.categoryname')
        .where('a.candidateuserid', userId).where('a.isdeleted', 0)
        .orderBy('a.addeddate', 'desc');

      // Candidate profile
      const candidate = await db('tblcandidate')

      const statusLabels = ['New','Shortlisted','Interview','Offered','Rejected','Withdrawn'];
      const statusBadge  = ['secondary','success','info','primary','danger','warning'];

      res.render('front/user-dashboard', {
        title: 'My Dashboard', myApps, candidate, statusLabels, statusBadge, moment
      });
    } catch (err) {
      console.error('userDashboard error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── MY APPLICATIONS ───────────────────────────────────────────────────────
  myApplications: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/account/login');
      const userId = req.session.user.userid;

      const apps = await db('tbljobapplication as a')
        .join('tbljobpost as j', 'a.jobid', 'j.jobid')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .select('a.*', 'j.jobtitle', 'c.categoryname')
        .where('a.candidateuserid', userId).where('a.isdeleted', 0)
        .orderBy('a.addeddate', 'desc');

      const statusLabels = ['New','Shortlisted','Interview','Offered','Rejected','Withdrawn'];
      res.render('front/my-applications', { title: 'My Applications', apps, statusLabels, moment });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  about:           (req, res) => res.render('front/about',                 { title: 'About Us' }),
  contact:         (req, res) => res.render('front/contact',               { title: 'Contact' }),
  privacyPolicy:   (req, res) => res.render('front/privacy-policy',        { title: 'Privacy Policy' }),
  termsConditions: (req, res) => res.render('front/terms-and-conditions',  { title: 'Terms & Conditions' }),
  thankYou:        (req, res) => res.render('front/thank-you',             { title: 'Application Submitted!' })
};

module.exports = { frontController, upload };
// NOTE: employer methods added below — module.exports already at end of file
