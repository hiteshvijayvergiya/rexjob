// controllers/homeController.js - Home Page Controller
const db = require('../config/database');
const { uploadToS3 } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const homeController = {
  /**
   * Homepage - Display latest 5 jobs, categories, newsletter
   */
  index: async (req, res) => {
    try {
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Track visitor
      await trackVisitor(req);

      // Get latest 5 active jobs
      const latestJobs = await db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .join('tblrequirementpriority as pri', 'r.requirementpriorityid', 'pri.requirementpriorityid')
        .select(
          'r.requirementid',
          'r.requirementname',
          'r.requirementarea',
          'r.requirementdescription',
          'r.salarystart',
          'r.salaryend',
          'r.expstart',
          'r.expend',
          'r.jobtype',
          'r.noofrequirement',
          'r.addeddate',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname',
          'pri.requirementpriorityname'
        )
        .where('r.companyid', companyId)
        .where('r.isactive', true)
        .whereNull('r.isdeleted')
        .orWhere('r.isdeleted', false)
        .orderBy('r.addeddate', 'desc')
        .limit(5);

      // Get all job categories with job count
      const categories = await db('tblrequirementtype as rt')
        .leftJoin('tblrequirement as r', function() {
          this.on('rt.requirementtypeid', 'r.requirementtypeid')
            .andOn('r.isactive', db.raw('?', [true]))
            .andOn(db.raw('IFNULL(r.isdeleted, 0)'), db.raw('?', [0]));
        })
        .select('rt.requirementtypeid', 'rt.requirementtypename')
        .count('r.requirementid as jobcount')
        .where('rt.companyid', companyId)
        .where('rt.isactive', true)
        .whereNull('rt.isdeleted')
        .orWhere('rt.isdeleted', false)
        .groupBy('rt.requirementtypeid', 'rt.requirementtypename')
        .orderBy('jobcount', 'desc');

      res.render('home/index', {
        title: 'RexJobs - Find Your Dream Job',
        jobs: latestJobs,
        categories: categories,
        moment: moment
      });
    } catch (error) {
      console.error('Error in homepage:', error);
      res.status(500).render('error/500', {
        title: 'Error',
        message: 'Failed to load homepage'
      });
    }
  },

  /**
   * Career Page - Browse all jobs with filters
   */
  career: async (req, res) => {
    try {
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;
      const page = parseInt(req.query.page) || 1;
      const perPage = 20;
      const offset = (page - 1) * perPage;

      // Filters
      const categoryId = req.query.category || 0;
      const technologyId = req.query.technology || 0;
      const locationId = req.query.location || 0;
      const jobType = req.query.jobtype || 0;
      const searchValue = req.query.search || '';

      // Build query
      let query = db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .join('tblrequirementpriority as pri', 'r.requirementpriorityid', 'pri.requirementpriorityid')
        .select(
          'r.*',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname',
          'pri.requirementpriorityname'
        )
        .where('r.companyid', companyId)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        });

      // Apply filters
      if (categoryId > 0) {
        query.where('r.requirementtypeid', categoryId);
      }
      if (technologyId > 0) {
        query.where('r.requirementpositionid', technologyId);
      }
      if (locationId > 0) {
        query.where('r.requirementcity', locationId);
      }
      if (jobType > 0) {
        query.where('r.jobtype', jobType);
      }
      if (searchValue) {
        query.where(function() {
          this.where('r.requirementname', 'like', `%${searchValue}%`)
            .orWhere('r.requirementdescription', 'like', `%${searchValue}%`)
            .orWhere('rt.requirementtypename', 'like', `%${searchValue}%`)
            .orWhere('c.name', 'like', `%${searchValue}%`);
        });
      }

      // Get total count
      const countQuery = query.clone();
      const totalCount = await countQuery.count('r.requirementid as count').first();
      const total = totalCount.count;

      // Get paginated results
      const jobs = await query
        .orderBy('r.addeddate', 'desc')
        .limit(perPage)
        .offset(offset);

      // Get filter options
      const categories = await db('tblrequirementtype')
        .select('requirementtypeid as value', 'requirementtypename as text')
        .where('companyid', companyId)
        .where('isactive', true)
        .whereNull('isdeleted')
        .orWhere('isdeleted', false);

      const technologies = await db('tblrequirementposition')
        .select('requirementpositionid as value', 'requirementpositionname as text')
        .where('companyid', companyId)
        .where('isactive', true)
        .whereNull('isdeleted')
        .orWhere('isdeleted', false);

      const locations = await db.raw(`
        SELECT DISTINCT c.id as value, c.name as text
        FROM tblcity c
        INNER JOIN tblrequirement r ON r.requirementcity = c.id
        WHERE r.companyid = ? AND r.isactive = 1
        ORDER BY c.name
      `, [companyId]);

      res.render('home/career', {
        title: 'Career Opportunities',
        jobs: jobs,
        categories: categories,
        technologies: technologies,
        locations: locations.length > 0 ? locations[0] : [],
        filters: {
          category: categoryId,
          technology: technologyId,
          location: locationId,
          jobtype: jobType,
          search: searchValue
        },
        pagination: {
          page: page,
          perPage: perPage,
          total: total,
          totalPages: Math.ceil(total / perPage)
        },
        moment: moment
      });
    } catch (error) {
      console.error('Error in career page:', error);
      res.status(500).render('error/500', {
        title: 'Error',
        message: 'Failed to load career page'
      });
    }
  },

  /**
   * Category Page - Jobs by category
   */
  category: async (req, res) => {
    try {
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;
      const seoName = req.params.seoname;

      // Get category details with SEO
      const category = await db('tblrequirementtype')
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .where('requirementtypename', 'like', `%${seoName}%`)
        .first();

      if (!category) {
        return res.status(404).render('error/404', {
          title: 'Category Not Found'
        });
      }

      // Get jobs in this category
      const jobs = await db('tblrequirement as r')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .select('r.*', 'rp.requirementpositionname', 'c.name as cityname')
        .where('r.requirementtypeid', category.requirementtypeid)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .orderBy('r.addeddate', 'desc');

      res.render('home/category', {
        title: category.requirementtypename,
        category: category,
        jobs: jobs,
        seoTitle: category.SeoJobTitle || category.requirementtypename,
        seoKeywords: category.SeoJobKeyword || '',
        seoDescription: category.SeoJobDescription || '',
        moment: moment
      });
    } catch (error) {
      console.error('Error in category page:', error);
      res.status(500).render('error/500', {
        title: 'Error',
        message: 'Failed to load category'
      });
    }
  },

  /**
   * Job Details Page
   */
  jobDetails: async (req, res) => {
    try {
      const jobId = req.params.id;

      const job = await db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .leftJoin('tblstates as s', 'r.requirementstate', 's.id')
        .leftJoin('tblcountries as co', 'r.requirementcountry', 'co.id')
        .join('tblrequirementpriority as pri', 'r.requirementpriorityid', 'pri.requirementpriorityid')
        .select('r.*', 'rt.requirementtypename', 'rp.requirementpositionname', 
                'c.name as cityname', 's.name as statename', 'co.name as countryname',
                'pri.requirementpriorityname')
        .where('r.requirementid', jobId)
        .first();

      if (!job) {
        return res.status(404).render('error/404', {
          title: 'Job Not Found'
        });
      }

      // Get related jobs
      const relatedJobs = await db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .select('r.requirementid', 'r.requirementname', 'rt.requirementtypename', 
                'c.name as cityname', 'r.addeddate')
        .where('r.requirementtypeid', job.requirementtypeid)
        .where('r.requirementid', '!=', jobId)
        .where('r.isactive', true)
        .where(function() {
          this.whereNull('r.isdeleted').orWhere('r.isdeleted', false);
        })
        .limit(5)
        .orderBy('r.addeddate', 'desc');

      res.render('home/job-details', {
        title: job.requirementname,
        job: job,
        relatedJobs: relatedJobs,
        moment: moment
      });
    } catch (error) {
      console.error('Error in job details:', error);
      res.status(500).render('error/500', {
        title: 'Error',
        message: 'Failed to load job details'
      });
    }
  },

  /**
   * Apply for Job
   */
  applyJob: async (req, res) => {
    try {
      const { name, email, mobile, requirementid, experienceYears, experienceMonths,
              currentSalary, expectedSalary, noticePeriod, reasonChange } = req.body;
      
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Check if already applied
      const existing = await db('tblapplyjob')
        .where('applyjobemail', email)
        .where('requirementid', requirementid)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .first();

      if (existing) {
        return res.json({
          statusCode: 400,
          msg: 'You have already applied for this job'
        });
      }

      // Upload resume to S3
      let resumePath = null;
      if (req.file) {
        const fileName = `${uuidv4()}.${req.file.originalname.split('.').pop()}`;
        const folder = `CandidateResume/${companyId}/`;
        resumePath = await uploadToS3(req.file.buffer, fileName, folder, req.file.mimetype);
      }

      // Insert application
      const [applicationId] = await db('tblapplyjob').insert({
        uuid: uuidv4(),
        applyjobname: name,
        applyjobemail: email,
        applyjobmobile: mobile,
        requirementid: requirementid,
        applyjobresume: resumePath,
        totalexperienceyear: experienceYears || 0,
        totalexperiencemonth: experienceMonths || 0,
        currentsalray: currentSalary || 0,
        expectedsalary: expectedSalary || 0,
        noticeperiod: noticePeriod || 0,
        reasonjobchange: reasonChange || '',
        addeddate: new Date(),
        companyid: companyId,
        isdeleted: false
      });

      // Send confirmation email (implement email service)
      // await sendApplicationEmail(email, name);

      res.json({
        statusCode: 200,
        msg: 'Application submitted successfully!',
        id: applicationId
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to submit application'
      });
    }
  },

  /**
   * Newsletter Subscription
   */
  newsletter: async (req, res) => {
    try {
      const { email } = req.body;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Check if already subscribed
      const existing = await db('tlbnewsletter')
        .where('newsletteremail', email)
        .where('company_id', companyId)
        .first();

      if (existing) {
        // Update subscription status
        await db('tlbnewsletter')
          .where('newsletterid', existing.newsletterid)
          .update({ issubscribe: true });
      } else {
        // Insert new subscription
        await db('tlbnewsletter').insert({
          uuid: uuidv4(),
          newsletteremail: email,
          issubscribe: true,
          addeddate: new Date(),
          company_id: companyId
        });
      }

      res.json({
        statusCode: 200,
        msg: 'Successfully subscribed to newsletter!'
      });
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to subscribe'
      });
    }
  },

  /**
   * Submit Contact Query
   */
  submitQuery: async (req, res) => {
    try {
      const { name, email, mobile, subject, message } = req.body;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      await db('tblsubmitquery').insert({
        uuid: uuidv4(),
        name: name,
        email: email,
        mobile: mobile,
        subject: subject,
        description: message,
        addeddate: new Date(),
        companyid: companyId,
        isdeleted: false
      });

      res.json({
        statusCode: 200,
        msg: 'Your query has been submitted successfully!'
      });
    } catch (error) {
      console.error('Error submitting query:', error);
      res.json({
        statusCode: 500,
        msg: 'Failed to submit query'
      });
    }
  },

  /**
   * Get Technologies by Category (AJAX)
   */
  getTechnologies: async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      const technologies = await db('tblrequirementposition')
        .select('requirementpositionid as value', 'requirementpositionname as text')
        .where('requirementtypeid', categoryId)
        .where('companyid', companyId)
        .where('isactive', true)
        .where(function() {
          this.whereNull('isdeleted').orWhere('isdeleted', false);
        })
        .orderBy('requirementpositionname');

      res.json(technologies);
    } catch (error) {
      console.error('Error getting technologies:', error);
      res.json([]);
    }
  },

  /**
   * Get Locations by Technology (AJAX)
   */
  getLocations: async (req, res) => {
    try {
      const technologyId = req.params.technologyId;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      const locations = await db.raw(`
        SELECT DISTINCT c.id as value, c.name as text
        FROM tblcity c
        INNER JOIN tblrequirement r ON r.requirementcity = c.id
        WHERE r.requirementpositionid = ?
          AND r.companyid = ?
          AND r.isactive = 1
          AND IFNULL(r.isdeleted, 0) = 0
        ORDER BY c.name
      `, [technologyId, companyId]);

      res.json(locations[0] || []);
    } catch (error) {
      console.error('Error getting locations:', error);
      res.json([]);
    }
  },

  /**
   * About Page
   */
  about: (req, res) => {
    res.render('home/about', {
      title: 'About Us'
    });
  },

  /**
   * Contact Page
   */
  contact: (req, res) => {
    res.render('home/contact', {
      title: 'Contact Us'
    });
  },

    // Privacy Policy
    privacyPolicy: (req, res) => {
      console.log("pp")
        res.render('home/privacy-policy', {
            title: 'Privacy Policy'
        });
    },

    // Terms and Conditions
    termsConditions: (req, res) => {
        res.render('home/terms-and-conditions', {
            title: 'Terms and Conditions'
        });
    },

    // Cookie Policy
    cookiePolicy: (req, res) => {
        res.render('home/cookie-policy', {
            title: 'Cookie Policy'
        });
    },

    // Do Not Sell
    doNotSell: (req, res) => {
        res.render('home/do-not-sell', {
            title: 'Do Not Sell My Personal Information'
        });
    },

    // FAQ
    faq: (req, res) => {
        res.render('home/faq', {
            title: 'Frequently Asked Questions'
        });
    },
};

/**
 * Track visitor analytics
 */
async function trackVisitor(req) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const hostname = req.get('host');
    const referrer = req.get('referer') || '';
    
    let source = 'direct';
    if (referrer.includes('youtube')) source = 'youtube';
    else if (referrer.includes('facebook')) source = 'facebook';
    else if (referrer.includes('linkedin')) source = 'linkedin';
    else if (referrer.includes('google')) source = 'google';

    // Check if visitor exists
    const existing = await db('visitorcount')
      .where('ip', ip)
      .where(function() {
        this.where('hostname', source).orWhereNull('hostname');
      })
      .first();

    if (existing) {
      // Update count
      await db('visitorcount')
        .where('id', existing.id)
        .increment('count', 1)
        .update({ addeddate: new Date() });
    } else {
      // Insert new visitor
      await db('visitorcount').insert({
        ip: ip,
        hostname: source,
        count: 1,
        addeddate: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking visitor:', error);
  }
}

module.exports = homeController;
