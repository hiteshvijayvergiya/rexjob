// controllers/adminController.js  — MySQL compatible
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

function buildTree(items, parentId = null) {
  return items
    .filter(i => i.parent_id === parentId)
    .map(i => ({ ...i, children: buildTree(items, i.categoryid) }));
}

const adminController = {

  dashboard: async (req, res) => {
    try {
      const { range = 'today' } = req.query;
      let dateFrom;
      if (range === 'weekly')       dateFrom = moment().subtract(7,  'days').toDate();
      else if (range === 'monthly') dateFrom = moment().subtract(30, 'days').toDate();
      else                          dateFrom = moment().startOf('day').toDate();

      const [[r1],[r2],[r3],[r4],[r5],[r6]] = await Promise.all([
        db('tbljobpost').where('isdeleted',0).count('jobid as cnt'),
        db('tbljobpost').where('isdeleted',0).where('addeddate','>=',dateFrom).count('jobid as cnt'),
        db('tbljobpost').where('isdeleted',0).where('approvalstatus',0).count('jobid as cnt'),
        db('tbljobapplication').where('isdeleted',0).count('applicationid as cnt'),
        db('tbljobapplication').where('isdeleted',0).where('addeddate','>=',dateFrom).count('applicationid as cnt'),
        db('tblcandidate').where('isdeleted',0).count('candidateid as cnt'),
      ]);

      const recentApps = await db('tbljobapplication as a')
        .join('tbljobpost as j', 'a.jobid', 'j.jobid')
        .select('a.applicationid','a.fullname','a.email','a.addeddate','j.jobtitle','a.status')
        .where('a.isdeleted',0).orderBy('a.addeddate','desc').limit(10);

      const recentJobs = await db('tbljobpost as j')
        .leftJoin('tbljobapplication as a','j.jobid','a.jobid')
        .select('j.jobid','j.jobtitle','j.addeddate','j.approvalstatus',
                db.raw('COUNT(a.applicationid) as appcount'))
        .where('j.isdeleted',0)
        .groupBy('j.jobid','j.jobtitle','j.addeddate','j.approvalstatus')
        .orderBy('j.addeddate','desc').limit(10);

      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats: { jobTotal:Number(r1.cnt), jobRange:Number(r2.cnt), pendingApproval:Number(r3.cnt), appTotal:Number(r4.cnt), appRange:Number(r5.cnt), candTotal:Number(r6.cnt) },
        recentApps, recentJobs, range, moment
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  categoryList: async (req, res) => {
    try {
      const flat = await db('tbljobcategory').where('isdeleted', 0).orderBy('depth').orderBy('sort_order').orderBy('categoryname');
      const tree = buildTree(flat);
      res.render('admin/category-list', { title: 'Job Categories', tree, flat, moment });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  categoryCreate: async (req, res) => {
    try {
      const flat = await db('tbljobcategory').where('isdeleted', 0).orderBy('depth').orderBy('categoryname');
      res.render('admin/category-form', { title: 'Add Category', cat: null, flat });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  categoryStore: async (req, res) => {
    try {
      const userId    = req.session.user.userid;
      const { categoryname, categorydescription, parent_id, sort_order } = req.body;

      if (!categoryname || !categoryname.trim()) {
        req.flash('error_msg', 'Category name is required');
        return res.redirect('/admin/categories/create');
      }

      const seoname = categoryname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let depth = 0, path = '';
      const pid = parent_id ? parseInt(parent_id) : null;
      if (pid) {
        const parent = await db('tbljobcategory').where('categoryid', pid).first();
        if (parent) { depth = (parent.depth || 0) + 1; path = (parent.path ? parent.path + '/' : '') + parent.categoryid; }
      }

      await db('tbljobcategory').insert({
        uuid: uuidv4(), categoryname: categoryname.trim(), categoryseoname: seoname,
        categorydescription: categorydescription || null, parent_id: pid,
        sort_order: parseInt(sort_order) || 0, depth, path,
         addeddate: new Date(), addedby: userId, isactive: 1, isdeleted: 0
      });

      req.flash('success_msg', 'Category created!');
      res.redirect('/admin/categories');
    } catch (err) {
      console.error('categoryStore error:', err);
      req.flash('error_msg', 'Failed: ' + err.message);
      res.redirect('/admin/categories/create');
    }
  },

  categoryEdit: async (req, res) => {
    try {
      const cat  = await db('tbljobcategory').where('categoryid', req.params.id).first();
      if (!cat) return res.status(404).render('error/404', { title: 'Not Found' });
      const flat = await db('tbljobcategory').where('isdeleted', 0).orderBy('depth').orderBy('categoryname');
      res.render('admin/category-form', { title: 'Edit Category', cat, flat });
    } catch (err) {
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  categoryUpdate: async (req, res) => {
    try {
      const userId = req.session.user.userid;
      const { categoryname, categorydescription, parent_id, sort_order, isactive } = req.body;
      const seoname = categoryname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let depth = 0, path = '';
      const pid = parent_id ? parseInt(parent_id) : null;
      if (pid) {
        const parent = await db('tbljobcategory').where('categoryid', pid).first();
        if (parent) { depth = (parent.depth||0)+1; path = (parent.path?parent.path+'/':'') + parent.categoryid; }
      }
      await db('tbljobcategory').where('categoryid', req.params.id).update({
        categoryname, categoryseoname: seoname, categorydescription: categorydescription||null,
        parent_id: pid, sort_order: parseInt(sort_order)||0, depth, path,
        isactive: isactive === '1' ? 1 : 0, updateddate: new Date(), updatedby: userId
      });
      req.flash('success_msg', 'Category updated!');
      res.redirect('/admin/categories');
    } catch (err) {
      req.flash('error_msg', 'Failed: ' + err.message);
      res.redirect('/admin/categories/' + req.params.id + '/edit');
    }
  },

  categoryDelete: async (req, res) => {
    try {
      await db('tbljobcategory').where('categoryid', req.params.id)
        .update({ isdeleted: 1, deleteddate: new Date(), deletedby: req.session.user.userid });
      res.json({ statusCode: 200, msg: 'Deleted' });
    } catch (err) { res.json({ statusCode: 500, msg: err.message }); }
  },

  jobList: async (req, res) => {
    try {
      const page         = parseInt(req.query.page) || 1;
      const limit        = 20, offset = (page-1)*limit;
      const search       = req.query.search || '';
      const statusFilter = req.query.status !== undefined ? req.query.status : '';

      let q = db('tbljobpost as j')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .leftJoin('tbluser as u', 'u.userid', 'j.postedby')
        .leftJoin('tbljobapplication as a', 'j.jobid', 'a.jobid')
        .select('j.jobid','j.jobtitle','j.approvalstatus','j.isactive','j.addeddate','j.jobtype',
                'c.categoryname', db.raw("CONCAT(IFNULL(u.fname,''),' ',IFNULL(u.lname,'')) as postername"),
                db.raw('COUNT(a.applicationid) as appcount'))
        .where('j.isdeleted', 0)
        .groupBy('j.jobid','j.jobtitle','j.approvalstatus','j.isactive','j.addeddate','j.jobtype','c.categoryname','u.fname','u.lname');

      let countQ = db('tbljobpost as j').where('j.isdeleted', 0);
      if (search)          { q = q.where('j.jobtitle', 'like', `%${search}%`); countQ = countQ.where('j.jobtitle', 'like', `%${search}%`); }
      if (statusFilter !== '') { q = q.where('j.approvalstatus', parseInt(statusFilter)); countQ = countQ.where('j.approvalstatus', parseInt(statusFilter)); }
      const [{ cnt: total }] = await countQ.count('j.jobid as cnt');

      const jobs = await q.orderBy('j.addeddate', 'desc').limit(limit).offset(offset);
      res.render('admin/job-list', {
        title: 'Manage Jobs', jobs, search, statusFilter,
        pagination: { page, totalPages: Math.ceil(Number(total)/limit), total: Number(total) }, moment
      });
    } catch (err) {
      console.error('jobList error:', err);
      res.status(500).render('error/500', { title: 'Error', message: err.message });
    }
  },

  jobCreate: async (req, res) => {
    try {
      const flat = await db('tbljobcategory').where('isdeleted', 0).where('isactive', 1).orderBy('depth').orderBy('sort_order').orderBy('categoryname');
      const cities = await db('tblcity').select('id','name').orderBy('name').limit(500);
      res.render('admin/job-form', { title: 'Add Job', job: null, flat, cities });
    } catch (err) { res.status(500).render('error/500', { title: 'Error', message: err.message }); }
  },

  jobStore: async (req, res) => {
    try {
      const userId    = req.session.user.userid;
      const isAdmin   = !!(req.session.user.isadmin || req.session.user.issuperadmin);
      const { jobtitle, categoryid, jobtype, jobcity, jobdescription, jobskills,
              jobresponsibility, jobeducation, expstart, expend, salarystart, salaryend,
              noofopenings, jobstart, jobend, jobdocument } = req.body;

      if (!jobtitle || !jobtitle.trim()) {
        req.flash('error_msg', 'Job title is required');
        return res.redirect('/admin/jobs/create');
      }

      const seoname = jobtitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      await db('tbljobpost').insert({
        uuid: uuidv4(), postedby: userId,
        categoryid: categoryid||null, jobtitle: jobtitle.trim(), jobseoname: seoname,
        jobtype: parseInt(jobtype)||1, jobcity: jobcity||null,
        jobdescription: jobdescription||null, jobskills: jobskills||null,
        jobresponsibility: jobresponsibility||null, jobeducation: jobeducation||null,
        expstart: expstart||null, expend: expend||null,
        salarystart: salarystart||null, salaryend: salaryend||null,
        noofopenings: parseInt(noofopenings)||1,
        jobstart: jobstart||null, jobend: jobend||null, jobdocument: jobdocument||null,
        approvalstatus: isAdmin ? 1 : 0,
        approvedby: isAdmin ? userId : null, approveddate: isAdmin ? new Date() : null,
        isactive: isAdmin ? 1 : 0, isdeleted: 0, addeddate: new Date(), addedby: userId
      });

      req.flash('success_msg', isAdmin ? 'Job posted & approved!' : 'Job submitted for approval!');
      res.redirect('/admin/jobs');
    } catch (err) {
      console.error('jobStore error:', err);
      req.flash('error_msg', 'Failed to save job: ' + err.message);
      res.redirect('/admin/jobs/create');
    }
  },

  jobEdit: async (req, res) => {
    try {
      const job  = await db('tbljobpost').where('jobid', req.params.id).first();
      if (!job) return res.status(404).render('error/404', { title: 'Not Found' });
      const flat = await db('tbljobcategory').where('isdeleted', 0).where('isactive', 1).orderBy('depth').orderBy('sort_order').orderBy('categoryname');
      const cities = await db('tblcity').select('id','name').orderBy('name').limit(500);
      res.render('admin/job-form', { title: 'Edit Job', job, flat, cities });
    } catch (err) { res.status(500).render('error/500', { title: 'Error', message: err.message }); }
  },

  jobUpdate: async (req, res) => {
    try {
      const userId = req.session.user.userid;
      const { jobtitle, categoryid, jobtype, jobcity, jobdescription, jobskills,
              jobresponsibility, jobeducation, expstart, expend, salarystart, salaryend,
              noofopenings, jobstart, jobend, jobdocument } = req.body;

      if (!jobtitle || !jobtitle.trim()) {
        req.flash('error_msg', 'Job title is required');
        return res.redirect('/admin/jobs/' + req.params.id + '/edit');
      }

      const seoname = jobtitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await db('tbljobpost').where('jobid', req.params.id).update({
        categoryid: categoryid||null, jobtitle, jobseoname: seoname,
        jobtype: parseInt(jobtype)||1, jobcity: jobcity||null,
        jobdescription: jobdescription||null, jobskills: jobskills||null,
        jobresponsibility: jobresponsibility||null, jobeducation: jobeducation||null,
        expstart: expstart||null, expend: expend||null,
        salarystart: salarystart||null, salaryend: salaryend||null,
        noofopenings: parseInt(noofopenings)||1,
        jobstart: jobstart||null, jobend: jobend||null, jobdocument: jobdocument||null,
        updateddate: new Date(), updatedby: userId
      });

      req.flash('success_msg', 'Job updated successfully!');
      res.redirect('/admin/jobs');
    } catch (err) {
      console.error('jobUpdate error:', err);
      req.flash('error_msg', 'Failed: ' + err.message);
      res.redirect('/admin/jobs/' + req.params.id + '/edit');
    }
  },

  jobDelete: async (req, res) => {
    try {
      await db('tbljobpost').where('jobid', req.params.id)
        .update({ isdeleted: 1, isactive: 0, deleteddate: new Date(), deletedby: req.session.user.userid });
      res.json({ statusCode: 200, msg: 'Deleted' });
    } catch (err) { res.json({ statusCode: 500, msg: err.message }); }
  },

  jobApprove: async (req, res) => {
    try {
      const userId = req.session.user.userid;
      const { jobid, action, rejectionreason } = req.body;
      const update = action === 'approve'
        ? { approvalstatus:1, isactive:1, approvedby:userId, approveddate:new Date(), rejectionreason:null }
        : { approvalstatus:2, isactive:0, approvedby:userId, approveddate:new Date(), rejectionreason:rejectionreason||'' };
      await db('tbljobpost').where('jobid', jobid).update({ ...update, updateddate:new Date(), updatedby:userId });
      res.json({ statusCode: 200, msg: action === 'approve' ? 'Approved!' : 'Rejected' });
    } catch (err) { res.json({ statusCode: 500, msg: err.message }); }
  },

  applicationList: async (req, res) => {
    try {
      const page = parseInt(req.query.page)||1, limit=20, offset=(page-1)*20;
      const search = req.query.search||'', jobFilter = parseInt(req.query.job)||0;

      let q = db('tbljobapplication as a')
        .join('tbljobpost as j', 'a.jobid', 'j.jobid')
        .leftJoin('tbljobcategory as c', 'c.categoryid', 'j.categoryid')
        .select('a.*', 'j.jobtitle', 'c.categoryname')
        .where('a.isdeleted', 0);
      if (search) q = q.where(function(){ this.where('a.fullname','like',`%${search}%`).orWhere('a.email','like',`%${search}%`); });
      if (jobFilter>0) q = q.where('a.jobid', jobFilter);

      let countQ = db('tbljobapplication as a').join('tbljobpost as j','a.jobid','j.jobid').where('a.isdeleted', 0);
      if (search) countQ = countQ.where(function(){ this.where('a.fullname','like',`%${search}%`).orWhere('a.email','like',`%${search}%`); });
      if (jobFilter>0) countQ = countQ.where('a.jobid', jobFilter);
      const [{ cnt:total }] = await countQ.count('a.applicationid as cnt');

      const apps = await q.orderBy('a.addeddate','desc').limit(limit).offset(offset);
      const jobs = await db('tbljobpost').where('isdeleted',0).select('jobid as value','jobtitle as text').orderBy('jobtitle');

      res.render('admin/application-list', {
        title:'Applications', apps, jobs, search, jobFilter,
        pagination:{ page, totalPages:Math.ceil(Number(total)/limit), total:Number(total) },
        statusLabels:['New','Shortlisted','Interview','Offered','Rejected','Withdrawn'], moment
      });
    } catch (err) { res.status(500).render('error/500',{title:'Error',message:err.message}); }
  },

  applicationView: async (req, res) => {
    try {
      const app = await db('tbljobapplication as a')
        .join('tbljobpost as j','a.jobid','j.jobid')
        .leftJoin('tbljobcategory as c','c.categoryid','j.categoryid')
        .select('a.*','j.jobtitle','j.jobdescription','c.categoryname')
        .where('a.applicationid', req.params.id).first();
      if (!app) return res.status(404).render('error/404',{title:'Not Found'});
      res.render('admin/application-view', {
        title:'Application Detail', app,
        statusLabels:['New','Shortlisted','Interview','Offered','Rejected','Withdrawn'], moment
      });
    } catch (err) { res.status(500).render('error/500',{title:'Error',message:err.message}); }
  },

  applicationStatus: async (req, res) => {
    try {
      const { applicationid, status } = req.body;
      await db('tbljobapplication').where('applicationid', applicationid).update({
        status: parseInt(status), isshortlisted: parseInt(status)===1 ? 1 : 0,
        updateddate: new Date(), updatedby: req.session.user.userid
      });
      res.json({ statusCode:200, msg:'Status updated!' });
    } catch (err) { res.json({ statusCode:500, msg:err.message }); }
  }
};

module.exports = adminController;
