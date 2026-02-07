// controllers/applicationsController.js - COMPLETE

const db = require('../config/database');
const moment = require('moment');

const applicationsController = {
  
  // List all applications
  index: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const companyId = req.session.user.companyid;
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      // Get filters
      const jobId = parseInt(req.query.job) || 0;
      const search = req.query.search || '';

      // Build query
      let query = db('tblapplyjob as a')
        .select(
          'a.*',
          'r.requirementname',
          'rt.requirementtypename',
          'rp.requirementpositionname'
        )
        .join('tblrequirement as r', 'a.requirementid', 'r.requirementid')
        .leftJoin('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .leftJoin('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .where('r.companyid', companyId)
        .where(function() {
          this.whereNull('a.isdeleted').orWhere('a.isdeleted', false);
        });

      // Apply filters
      if (jobId > 0) {
        query.where('a.requirementid', jobId);
      }

      if (search) {
        query.where(function() {
          this.where('a.applyjobname', 'like', `%${search}%`)
            .orWhere('a.applyjobemail', 'like', `%${search}%`)
            .orWhere('a.applyjobmobile', 'like', `%${search}%`);
        });
      }

      // Get total
      const countQuery = query.clone();
      const totalResult = await countQuery.count('* as total').first();
      const total = totalResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get applications
      const applications = await query
        .orderBy('a.addeddate', 'desc')
        .limit(limit)
        .offset(offset);

      // Get jobs for filter dropdown
      const jobs = await db('tblrequirement')
        .select('requirementid as value', 'requirementname as text')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementname');

      res.render('applications/index', {
        title: 'Job Applications',
        applications,
        jobs,
        search,
        jobId,
        pagination: { page, totalPages, total, limit },
        moment
      });
    } catch (error) {
      console.error('Applications error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // View application details
  view: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const applicationId = req.params.id;
      const companyId = req.session.user.companyid;

      const application = await db('tblapplyjob as a')
        .select(
          'a.*',
          'r.requirementname',
          'r.requirementdescription',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname'
        )
        .join('tblrequirement as r', 'a.requirementid', 'r.requirementid')
        .leftJoin('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .leftJoin('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .leftJoin('tblcity as c', 'r.requirementcity', 'c.id')
        .where('a.applyjobid', applicationId)
        .where('r.companyid', companyId)
        .first();

      if (!application) {
        return res.status(404).render('error/404', { title: 'Application Not Found' });
      }

      res.render('applications/view', {
        title: 'Application Details',
        application,
        moment
      });
    } catch (error) {
      console.error('Application view error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Update application status
  updateStatus: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.json({ statusCode: 401, msg: 'Unauthorized' });
      }

      const { applicationId, status } = req.body;

      await db('tblapplyjob')
        .where('applyjobid', applicationId)
        .update({
          status,
          updateddate: db.fn.now(),
          updatedby: req.session.user.userid
        });

      res.json({
        statusCode: 200,
        msg: 'Status updated successfully!'
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to update status'
      });
    }
  }
};

module.exports = applicationsController;
