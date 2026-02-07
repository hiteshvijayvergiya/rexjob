// controllers/jobsController.js - COMPLETE

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const jobsController = {
  
  // List all jobs
  index: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const companyId = req.session.user.companyid;
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      // Get search
      const search = req.query.search || '';

      // Build query
      let query = db('tblrequirement as r')
        .select(
          'r.*',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname',
          db.raw('COUNT(DISTINCT a.applyjobid) as applicationcount')
        )
        .leftJoin('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .leftJoin('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .leftJoin('tblcity as c', 'r.requirementcity', 'c.id')
        .leftJoin('tblapplyjob as a', function() {
          this.on('r.requirementid', 'a.requirementid')
            .andOn(db.raw('IFNULL(a.isdeleted, 0)'), db.raw('?', [0]));
        })
        .where('r.companyid', companyId)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .groupBy(
          'r.requirementid',
          'r.requirementname',
          'r.requirementdescription',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name'
        );

      // Apply search
      if (search) {
        query.where(function() {
          this.where('r.requirementname', 'like', `%${search}%`)
            .orWhere('r.requirementdescription', 'like', `%${search}%`);
        });
      }

      // Get total
      const countQuery = db('tblrequirement')
        .where('companyid', companyId)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        });
      
      if (search) {
        countQuery.where(function() {
          this.where('requirementname', 'like', `%${search}%`)
            .orWhere('requirementdescription', 'like', `%${search}%`);
        });
      }

      const totalResult = await countQuery.count('* as total').first();
      const total = totalResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get jobs
      const jobs = await query
        .orderBy('r.addeddate', 'desc')
        .limit(limit)
        .offset(offset);

      res.render('jobs/index', {
        title: 'Manage Jobs',
        jobs,
        search,
        pagination: { page, totalPages, total, limit },
        moment
      });
    } catch (error) {
      console.error('Jobs index error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Create job form
  create: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const companyId = req.session.user.companyid;

      // Get dropdowns
      const categories = await db('tblrequirementtype')
        .select('requirementtypeid', 'requirementtypename')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementtypename');

      const positions = await db('tblrequirementposition')
        .select('requirementpositionid', 'requirementpositionname', 'requirementtypeid')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementpositionname');

      const priorities = await db('tblrequirementpriority')
        .select('requirementpriorityid', 'requirementpriorityname')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementpriorityname');

      const cities = await db('tblcity')
        .select('id', 'name')
        .orderBy('name')
        .limit(100);

      res.render('jobs/create', {
        title: 'Post New Job',
        categories,
        positions,
        priorities,
        cities
      });
    } catch (error) {
      console.error('Create job form error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Store job
  store: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.json({ statusCode: 401, msg: 'Unauthorized' });
      }

      const {
        requirementname,
        requirementtypeid,
        requirementpositionid,
        requirementcity,
        requirementpriorityid,
        requirementdescription,
        requirementskill,
        requirementresponsibility,
        requirementeducation,
        salarystart,
        salaryend,
        expstart,
        expend,
        jobtype,
        noofrequirement,
        requirementdocument
      } = req.body;

      const companyId = req.session.user.companyid;
      const userId = req.session.user.userid;

      // Create SEO name
      const requirementseoname = requirementname
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Insert job
      const [requirementid] = await db('tblrequirement').insert({
        uuid: uuidv4(),
        requirementname,
        requirementseoname,
        requirementtypeid,
        requirementpositionid,
        requirementcity,
        requirementpriorityid,
        requirementdescription,
        requirementskill,
        requirementresponsibility,
        requirementeducation,
        salarystart,
        salaryend,
        expstart,
        expend,
        jobtype,
        noofrequirement,
        requirementdocument,
        addeddate: db.fn.now(),
        addedby: userId,
        isactive: true,
        isdeleted: false,
        companyid: companyId
      });

      res.json({
        statusCode: 200,
        msg: 'Job posted successfully!',
        requirementid
      });
    } catch (error) {
      console.error('Store job error:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to post job. Please try again.'
      });
    }
  },

  // Edit job form
  edit: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const jobId = req.params.id;
      const companyId = req.session.user.companyid;

      // Get job
      const job = await db('tblrequirement')
        .where('requirementid', jobId)
        .where('companyid', companyId)
        .first();

      if (!job) {
        return res.status(404).render('error/404', { title: 'Job Not Found' });
      }

      // Get dropdowns
      const categories = await db('tblrequirementtype')
        .select('requirementtypeid', 'requirementtypename')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementtypename');

      const positions = await db('tblrequirementposition')
        .select('requirementpositionid', 'requirementpositionname', 'requirementtypeid')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementpositionname');

      const priorities = await db('tblrequirementpriority')
        .select('requirementpriorityid', 'requirementpriorityname')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementpriorityname');

      const cities = await db('tblcity')
        .select('id', 'name')
        .orderBy('name')
        .limit(100);

      res.render('jobs/edit', {
        title: 'Edit Job',
        job,
        categories,
        positions,
        priorities,
        cities
      });
    } catch (error) {
      console.error('Edit job error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Update job
  update: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.json({ statusCode: 401, msg: 'Unauthorized' });
      }

      const jobId = req.params.id;
      const companyId = req.session.user.companyid;
      const userId = req.session.user.userid;

      const {
        requirementname,
        requirementtypeid,
        requirementpositionid,
        requirementcity,
        requirementpriorityid,
        requirementdescription,
        requirementskill,
        requirementresponsibility,
        requirementeducation,
        salarystart,
        salaryend,
        expstart,
        expend,
        jobtype,
        noofrequirement,
        requirementdocument
      } = req.body;

      // Create SEO name
      const requirementseoname = requirementname
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Update
      await db('tblrequirement')
        .where('requirementid', jobId)
        .where('companyid', companyId)
        .update({
          requirementname,
          requirementseoname,
          requirementtypeid,
          requirementpositionid,
          requirementcity,
          requirementpriorityid,
          requirementdescription,
          requirementskill,
          requirementresponsibility,
          requirementeducation,
          salarystart,
          salaryend,
          expstart,
          expend,
          jobtype,
          noofrequirement,
          requirementdocument,
          updateddate: db.fn.now(),
          updatedby: userId
        });

      res.json({
        statusCode: 200,
        msg: 'Job updated successfully!'
      });
    } catch (error) {
      console.error('Update job error:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to update job'
      });
    }
  },

  // Delete job
  delete: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.json({ statusCode: 401, msg: 'Unauthorized' });
      }

      const jobId = req.params.id;
      const companyId = req.session.user.companyid;
      const userId = req.session.user.userid;

      await db('tblrequirement')
        .where('requirementid', jobId)
        .where('companyid', companyId)
        .update({
          isdeleted: true,
          deleteddate: db.fn.now(),
          deletedby: userId
        });

      res.json({
        statusCode: 200,
        msg: 'Job deleted successfully!'
      });
    } catch (error) {
      console.error('Delete job error:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to delete job'
      });
    }
  }
};

module.exports = jobsController;
