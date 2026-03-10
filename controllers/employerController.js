// controllers/employerController.js
// Employer (usertypeid=3) — can post jobs, see only their own jobs/applications
const db  = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const employerController = {

  // ── EMPLOYER DASHBOARD ────────────────────────────────────────────────────
  dashboard: async (req, res) => {
    try {
      const userId    = req.session.user.userid;

      const myJobs = await db('tbljobpost as j')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .leftJoin('tbljobapplication as a', 'j.jobid', 'a.jobid')
        .select('j.jobid','j.jobtitle','j.approvalstatus','j.isactive','j.addeddate',
                'j.rejectionreason','c.categoryname',
                db.raw('COUNT(a.applicationid) as appcount'))
        .where('j.postedby', userId).where('j.isdeleted', 0)
        .groupBy('j.jobid','j.jobtitle','j.approvalstatus','j.isactive','j.addeddate','j.rejectionreason','c.categoryname')
        .orderBy('j.addeddate', 'desc');

      const stats = {
        total:    myJobs.length,
        approved: myJobs.filter(j => j.approvalstatus === 1).length,
        pending:  myJobs.filter(j => j.approvalstatus === 0).length,
        rejected: myJobs.filter(j => j.approvalstatus === 2).length,
        totalApps: myJobs.reduce((s, j) => s + Number(j.appcount||0), 0)
      };

      const aLabel = {0:'Pending',1:'Approved',2:'Rejected'};
      const aBadge = {0:'warning',1:'success',2:'danger'};
      res.render('employer/dashboard', {
        title: 'Employer Dashboard', myJobs, stats, aLabel, aBadge, moment
      });
    } catch (err) {
      console.error('employer dashboard error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── CREATE JOB FORM ───────────────────────────────────────────────────────
  jobCreate: async (req, res) => {
    try {
        const flat  = await db('tbljobcategory').where('isdeleted', 0).where('isactive', 1)
            .orderBy('depth').orderBy('sort_order').orderBy('categoryname');
      const cities = await db('tblcity').select('id','name').orderBy('name').limit(500);
      res.render('employer/job-form', { title: 'Post a Job', job: null, flat, cities });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── STORE JOB ─────────────────────────────────────────────────────────────
  jobStore: async (req, res) => {
    try {
      const userId    = req.session.user.userid;
      const { jobtitle, categoryid, jobtype, jobcity, jobdescription, jobskills,
              jobresponsibility, jobeducation, expstart, expend, salarystart, salaryend,
              noofopenings, jobend } = req.body;

      if (!jobtitle || !jobtitle.trim()) {
        req.flash('error_msg', 'Job title is required');
        return res.redirect('/employer/jobs/create');
      }

      const seoname = jobtitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Employer jobs always go to pending (approvalstatus=0)
      await db('tbljobpost').insert({
        uuid: uuidv4(), postedby: userId,
        categoryid: categoryid||null, jobtitle: jobtitle.trim(), jobseoname: seoname,
        jobtype: parseInt(jobtype)||1, jobcity: jobcity||null,
        jobdescription: jobdescription||null, jobskills: jobskills||null,
        jobresponsibility: jobresponsibility||null, jobeducation: jobeducation||null,
        expstart: expstart||null, expend: expend||null,
        salarystart: salarystart||null, salaryend: salaryend||null,
        noofopenings: parseInt(noofopenings)||1,
        jobend: jobend||null,
        approvalstatus: 0, isactive: 0, isdeleted: 0,
        addeddate: new Date(), addedby: userId, postedby: userId
      });

      req.flash('success_msg', 'Job submitted! It will be visible after admin approval.');
      res.redirect('/employer/dashboard');
    } catch (err) {
      console.error('employer jobStore error:', err);
      req.flash('error_msg', 'Failed: ' + err.message);
      res.redirect('/employer/jobs/create');
    }
  },

  // ── EDIT JOB FORM ─────────────────────────────────────────────────────────
  jobEdit: async (req, res) => {
    try {
      const userId    = req.session.user.userid;
      const job = await db('tbljobpost')
        .where('jobid', req.params.id).where('postedby', userId).where('isdeleted', 0).first();
      if (!job) {
        req.flash('error_msg', 'Job not found or access denied');
        return res.redirect('/employer/dashboard');
      }
        const flat = await db('tbljobcategory').where('isdeleted', 0).where('isactive', 1)
            .orderBy('depth').orderBy('sort_order').orderBy('categoryname');
        const cities = await db('tblcity').select('id','name').orderBy('name').limit(500);
      res.render('employer/job-form', { title: 'Edit Job', job, flat, cities });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  // ── UPDATE JOB — resets to pending ───────────────────────────────────────
  jobUpdate: async (req, res) => {
    try {
      const userId = req.session.user.userid;
      const job = await db('tbljobpost')
        .where('jobid', req.params.id).where('postedby', userId).where('isdeleted', 0).first();
      if (!job) {
        req.flash('error_msg', 'Job not found or access denied');
        return res.redirect('/employer/dashboard');
      }

      const { jobtitle, categoryid, jobtype, jobcity, jobdescription, jobskills,
              jobresponsibility, jobeducation, expstart, expend, salarystart, salaryend,
              noofopenings, jobend } = req.body;

      if (!jobtitle || !jobtitle.trim()) {
        req.flash('error_msg', 'Job title is required');
        return res.redirect('/employer/jobs/' + req.params.id + '/edit');
      }

      const seoname = jobtitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // ANY edit resets back to pending for re-approval
      await db('tbljobpost').where('jobid', req.params.id).update({
        categoryid: categoryid||null, jobtitle: jobtitle.trim(), jobseoname: seoname,
        jobtype: parseInt(jobtype)||1, jobcity: jobcity||null,
        jobdescription: jobdescription||null, jobskills: jobskills||null,
        jobresponsibility: jobresponsibility||null, jobeducation: jobeducation||null,
        expstart: expstart||null, expend: expend||null,
        salarystart: salarystart||null, salaryend: salaryend||null,
        noofopenings: parseInt(noofopenings)||1, jobend: jobend||null,
        // Reset approval
        approvalstatus: 0, isactive: 0,
        approvedby: null, approveddate: null, rejectionreason: null,
        updateddate: new Date(), updatedby: userId
      });

      req.flash('success_msg', 'Job updated and resubmitted for approval.');
      res.redirect('/employer/dashboard');
    } catch (err) {
      console.error('employer jobUpdate error:', err);
      req.flash('error_msg', 'Failed: ' + err.message);
      res.redirect('/employer/jobs/' + req.params.id + '/edit');
    }
  },

  // ── JOB DETAIL + APPLICATIONS (employer sees own job's applications) ──────
  jobDetail: async (req, res) => {
    try {
      const userId = req.session.user.userid;
      const job = await db('tbljobpost as j')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .select('j.*', 'c.categoryname')
        .where('j.jobid', req.params.id).where('j.postedby', userId).where('j.isdeleted', 0).first();
      if (!job) {
        req.flash('error_msg', 'Job not found');
        return res.redirect('/employer/dashboard');
      }

      const apps = await db('tbljobapplication')
        .where('jobid', req.params.id).where('isdeleted', 0)
        .orderBy('addeddate', 'desc');

      const statusLabels = ['New','Shortlisted','Interview','Offered','Rejected','Withdrawn'];
      const statusBadge  = ['secondary','success','info','primary','danger','warning'];
      const aLabel = {0:'Pending',1:'Approved',2:'Rejected'};
      const aBadge = {0:'warning',1:'success',2:'danger'};

      res.render('employer/job-detail', {
        title: job.jobtitle, job, apps, statusLabels, statusBadge, aLabel, aBadge, moment
      });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  }
};

module.exports = employerController;
