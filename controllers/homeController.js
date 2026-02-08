// controllers/homeController.js - SIMPLE: Categories → Jobs → Apply

const db = require('../config/database');
const moment = require('moment');

const homeController = {
  
  // Homepage
  index: async (req, res) => {
    try {
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Get latest jobs
      const jobs = await db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .select(
          'r.requirementid',
          'r.requirementname',
          'r.requirementdescription',
          'r.salarystart',
          'r.salaryend',
          'r.expstart',
          'r.expend',
          'r.addeddate',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname'
        )
        .where('r.companyid', companyId)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .orderBy('r.addeddate', 'desc')
        .limit(6);

      // Get parent categories (parent_id = NULL)
      const categories = await db('tblrequirementtype as rt')
        .leftJoin('tblrequirement as r', function() {
          this.on('rt.requirementtypeid', 'r.requirementtypeid')
            .andOn('r.isactive', db.raw('?', [true]))
            .andOn(db.raw('IFNULL(r.isdeleted, 0)'), db.raw('?', [0]));
        })
        .select(
          'rt.requirementtypeid',
          'rt.requirementtypename',
          'rt.requirementtypedescription'
        )
        .count('r.requirementid as jobcount')
        .where('rt.companyid', companyId)
        .where('rt.isactive', true)
        .whereNull('rt.parent_id')  // PARENT CATEGORIES ONLY
        .where(function() {
          this.whereNull('rt.isdeleted').orWhere('rt.isdeleted', false);
        })
        .groupBy('rt.requirementtypeid', 'rt.requirementtypename', 'rt.requirementtypedescription')
        .orderBy('jobcount', 'desc')
        .limit(8);

      res.render('home/index', {
        title: 'RexJobs - Find Your Dream Job',
        jobs,
        categories,
        moment
      });
    } catch (error) {
      console.error('Homepage error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Categories Page - Shows PARENT categories only
  categories: async (req, res) => {
    try {
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Get all parent categories (parent_id = NULL)
      const categories = await db('tblrequirementtype as rt')
        .leftJoin('tblrequirement as r', function() {
          this.on('rt.requirementtypeid', 'r.requirementtypeid')
            .andOn('r.isactive', db.raw('?', [true]))
            .andOn(db.raw('IFNULL(r.isdeleted, 0)'), db.raw('?', [0]));
        })
        .select(
          'rt.requirementtypeid',
          'rt.requirementtypename',
          'rt.requirementtypedescription'
        )
        .count('r.requirementid as jobcount')
        .where('rt.companyid', companyId)
        .where('rt.isactive', true)
        .whereNull('rt.parent_id')  // ONLY PARENT
        .where(function() {
          this.whereNull('rt.isdeleted').orWhere('rt.isdeleted', false);
        })
        .groupBy('rt.requirementtypeid', 'rt.requirementtypename', 'rt.requirementtypedescription')
        .orderBy('rt.requirementtypename');

      res.render('home/categories', {
        title: 'Job Categories',
        categories,
        moment
      });
    } catch (error) {
      console.error('Categories error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Category Jobs - Shows JOBS in clicked category
  categoryJobs: async (req, res) => {
    try {
      const categoryId = req.params.id;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Get category
      const category = await db('tblrequirementtype')
        .where('requirementtypeid', categoryId)
        .where('companyid', companyId)
        .first();

      if (!category) {
        return res.status(404).render('error/404', { title: 'Category Not Found' });
      }

      // Get ALL jobs in this category
      const jobs = await db('tblrequirement as r')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .leftJoin('tblrequirementpriority as pri', 'r.requirementpriorityid', 'pri.requirementpriorityid')
        .select(
          'r.requirementid',
          'r.requirementname',
          'r.requirementdescription',
          'r.salarystart',
          'r.salaryend',
          'r.expstart',
          'r.expend',
          'r.addeddate',
          'rp.requirementpositionname',
          'c.name as cityname',
          'pri.requirementpriorityname'
        )
        .where('r.requirementtypeid', categoryId)
        .where('r.companyid', companyId)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .orderBy('r.addeddate', 'desc');

      res.render('home/category-jobs', {
        title: `${category.requirementtypename} Jobs`,
        category,
        jobs,
        moment
      });
    } catch (error) {
      console.error('Category jobs error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Job Details
  jobDetails: async (req, res) => {
    try {
      const jobId = req.params.id;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      const job = await db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .leftJoin('tblrequirementpriority as pri', 'r.requirementpriorityid', 'pri.requirementpriorityid')
        .select(
          'r.*',
          'rt.requirementtypeid',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname',
          'pri.requirementpriorityname'
        )
        .where('r.requirementid', jobId)
        .where('r.companyid', companyId)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .first();

      if (!job) {
        return res.status(404).render('error/404', { title: 'Job Not Found' });
      }

      // Get related jobs
      const relatedJobs = await db('tblrequirement as r')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .select(
          'r.requirementid',
          'r.requirementname',
          'rp.requirementpositionname',
          'c.name as cityname'
        )
        .where('r.requirementtypeid', job.requirementtypeid)
        .where('r.requirementid', '!=', jobId)
        .where('r.companyid', companyId)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .orderBy('r.addeddate', 'desc')
        .limit(5);

      res.render('home/job-details', {
        title: job.requirementname,
        job,
        relatedJobs,
        moment
      });
    } catch (error) {
      console.error('Job details error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Static pages
  about: (req, res) => res.render('home/about', { title: 'About Us' }),
  contact: (req, res) => res.render('home/contact', { title: 'Contact Us' }),
  privacyPolicy: (req, res) => res.render('home/privacy-policy', { title: 'Privacy Policy' }),
  termsConditions: (req, res) => res.render('home/terms-and-conditions', { title: 'Terms and Conditions' }),
  cookiePolicy: (req, res) => res.render('home/cookie-policy', { title: 'Cookie Policy' }),
  doNotSell: (req, res) => res.render('home/do-not-sell', { title: 'Do Not Sell My Personal Information' }),
  faq: (req, res) => res.render('home/faq', { title: 'Frequently Asked Questions' })
};

module.exports = homeController;
