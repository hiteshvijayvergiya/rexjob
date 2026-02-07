// controllers/dashboardController.js - Dashboard Controller
const db = require('../config/database');
const moment = require('moment');

const dashboardController = {
  // Dashboard index
  index: async (req, res) => {
    try {
      const companyId = req.session.companyId || 1;
      const today = new Date();

      // Get statistics
      const stats = {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        todayApplications: 0,
        totalCandidates: 0,
        todayCandidates: 0,
        totalUsers: 0,
        newsletterSubscribers: 0
      };

      // Total and active jobs
      const jobStats = await db('tblrequirement')
        .where('companyid', companyId)
        .whereNull('isdeleted')
        .orWhere('isdeleted', false)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN isactive = 1 THEN 1 ELSE 0 END) as active')
        )
        .first();

      stats.totalJobs = jobStats.total || 0;
      stats.activeJobs = jobStats.active || 0;

      // Application stats
      const appStats = await db('tblapplyjob')
        .where('companyid', companyId)
        .whereNull('isdeleted')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw(`SUM(CASE WHEN DATE(addeddate) = DATE(?) THEN 1 ELSE 0 END) as today`, [today])
        )
        .first();

      stats.totalApplications = appStats.total || 0;
      stats.todayApplications = appStats.today || 0;

      // Candidate stats
      const candidateStats = await db('tblcandidate')
        .where('companyid', companyId)
        .whereNull('isdeleted')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw(`SUM(CASE WHEN DATE(addeddate) = DATE(?) THEN 1 ELSE 0 END) as today`, [today])
        )
        .first();

      stats.totalCandidates = candidateStats.total || 0;
      stats.todayCandidates = candidateStats.today || 0;

      // User count
      const userCount = await db('tbluser')
        .where('companyid', companyId)
        .whereNull('isdeleted')
        .count('userid as count')
        .first();

      stats.totalUsers = userCount.count || 0;

      // Newsletter subscribers
      const newsletterCount = await db('tlbnewsletter')
        .where('company_id', companyId)
        .where('issubscribe', true)
        .count('newsletterid as count')
        .first();

      stats.newsletterSubscribers = newsletterCount.count || 0;

      // Recent applications
      const recentApplications = await db('tblapplyjob as aj')
        .join('tblrequirement as r', 'aj.requirementid', 'r.requirementid')
        .select(
          'aj.applyjobid',
          'aj.applyjobname',
          'aj.applyjobemail',
          'aj.addeddate',
          'r.requirementname',
          'aj.isshortlisted'
        )
        .where('aj.companyid', companyId)
        .whereNull('aj.isdeleted')
        .orderBy('aj.addeddate', 'desc')
        .limit(10);

      // Recent jobs
      const recentJobs = await db('tblrequirement as r')
        .leftJoin('tblapplyjob as aj', function() {
          this.on('r.requirementid', 'aj.requirementid')
            .andOn(db.raw('IFNULL(aj.isdeleted, 0) = 0'));
        })
        .select(
          'r.requirementid',
          'r.requirementname',
          'r.addeddate',
          'r.isactive',
          db.raw('COUNT(aj.applyjobid) as applicationCount')
        )
        .where('r.companyid', companyId)
        .whereNull('r.isdeleted')
        .groupBy('r.requirementid', 'r.requirementname', 'r.addeddate', 'r.isactive')
        .orderBy('r.addeddate', 'desc')
        .limit(10);

      res.render('dashboard/index', {
        title: 'Dashboard',
        stats: stats,
        recentApplications: recentApplications,
        recentJobs: recentJobs,
        moment: moment
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).render('error/500', {
        title: 'Error',
        message: 'Failed to load dashboard'
      });
    }
  }
};

module.exports = dashboardController;
