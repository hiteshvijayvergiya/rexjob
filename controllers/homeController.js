// controllers/homeController.js - USING STORED PROCEDURES

const db = require('../config/database');
const { uploadToS3 } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const multer = require('multer');
const path = require('path');

// Configure Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {tblrequirement
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        cb(extname ? null : new Error('Only PDF, DOC, DOCX allowed'), extname);
    }
});

// Helper: Create SEO name
function createSeoName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const homeController = {

    /**
     * HOMEPAGE - Using sp_GetLatestJobs & sp_GetJobCategories
     */
    index: async (req, res) => {
        try {
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            // Call stored procedures
            const [jobsResult] = await db.raw('CALL sp_GetLatestJobs(?, ?)', [companyId, 6]);
            const [categoriesResult] = await db.raw('CALL sp_GetJobCategories(?)', [companyId]);

            const jobs = jobsResult[0] || [];
            const categories = categoriesResult[0] || [];

            // Add SEO names
            jobs.forEach(job => job.categoryseoname = createSeoName(job.requirementtypename));
            categories.forEach(cat => cat.categoryseoname = createSeoName(cat.requirementtypename));

            res.render('home/index', {
                title: 'RexJobs - Find Your Dream Job',
                appName: 'RexJobs',
                jobs,
                categories,
                moment,
                user: req.session.user || null,
                currentPath: req.path
            });
        } catch (error) {
            console.error('Homepage error:', error);
            res.status(500).render('error/500', {
                title: 'Error',
                message: error.message,
                appName: 'RexJobs',
                user: req.session.user || null
            });
        }
    },

    /**
     * CAREER PAGE - Using sp_SearchJobs
     */
    career: async (req, res) => {
        try {
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;
            const page = parseInt(req.query.page) || 1;
            const limit = 20;

            const filters = {
                search: req.query.search || '',
                category: parseInt(req.query.category) || 0,
                technology: parseInt(req.query.technology) || 0,
                location: parseInt(req.query.location) || 0,
                jobtype: parseInt(req.query.jobtype) || 0
            };

            // Call sp_SearchJobs
            const [result] = await db.raw('CALL sp_SearchJobs(?, ?, ?, ?, ?, ?, ?, ?)', [
                companyId,
                filters.search || null,
                filters.category,
                filters.technology,
                filters.location,
                filters.jobtype,
                page,
                limit
            ]);

            const jobs = result[0] || [];
            const total = result[1] ? result[1][0].total : 0;
            const totalPages = Math.ceil(total / limit);

            // Get filter dropdowns
            const [categoriesResult] = await db.raw('CALL sp_GetJobCategories(?)', [companyId]);
            const categories = categoriesResult[0] || [];

            const locations = await db('tblcity')
                .select('id as value', 'name as text')
                .orderBy('name')
                .limit(100);

            res.render('home/career', {
                title: 'Browse Jobs',
                appName: 'RexJobs',
                jobs,
                categories,
                locations,
                filters,
                pagination: { page, totalPages, total, limit },
                moment,
                user: req.session.user || null,
                currentPath: req.path
            });
        } catch (error) {
            console.error('Career error:', error);
            res.status(500).render('error/500', { title: 'Error', message: error.message });
        }
    },

    /**
     * CATEGORY PAGE - Using sp_GetCategoryJobs
     */
    category: async (req, res) => {
        try {
            const seoname = req.params.seoname;
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            // Find category by name (since we don't have seoname in table)
            const category = await db('tblrequirementtype')
                .where('companyid', companyId)
                .where('isactive', 1)
                .where(function() {
                    this.whereNull('isdeleted').orWhere('isdeleted', 0);
                })
                .whereRaw('LOWER(REPLACE(REPLACE(requirementtypename, " ", "-"), "&", "and")) = ?', [seoname])
                .first();

            if (!category) {
                return res.status(404).render('error/404', { title: 'Category Not Found' });
            }

            // Call sp_GetCategoryJobs
            const [result] = await db.raw('CALL sp_GetCategoryJobs(?, ?)', [
                category.requirementtypeid,
                companyId
            ]);

            const categoryDetails = result[0] ? result[0][0] : category;
            const jobs = result[1] || [];

            res.render('home/category', {
                title: `${categoryDetails.requirementtypename} Jobs`,
                appName: 'RexJobs',
                category: categoryDetails,
                jobs,
                moment,
                user: req.session.user || null,
                currentPath: req.path
            });
        } catch (error) {
            console.error('Category error:', error);
            res.status(500).render('error/500', { title: 'Error', message: error.message });
        }
    },

    /**
     * JOB DETAILS - Using sp_GetJobDetails
     */
    jobDetails: async (req, res) => {
        try {
            const jobId = req.params.id;
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            // Call sp_GetJobDetails
            const [result] = await db.raw('CALL sp_GetJobDetails(?, ?)', [jobId, companyId]);

            const job = result[0] ? result[0][0] : null;
            const relatedJobs = result[1] || [];

            if (!job) {
                return res.status(404).render('error/404', { title: 'Job Not Found' });
            }

            res.render('home/job-details', {
                title: job.requirementname,
                appName: 'RexJobs',
                job,
                relatedJobs,
                moment,
                user: req.session.user || null,
                currentPath: req.path
            });
        } catch (error) {
            console.error('Job details error:', error);
            res.status(500).render('error/500', { title: 'Error', message: error.message });
        }
    },

    /**
     * APPLY FOR JOB - Using sp_SubmitJobApplication
     */
    apply: [
        upload.single('resume'),
        async (req, res) => {
            try {
                const {
                    requirementid, applyjobname, applyjobemail, applyjobmobile,
                    currentlocation, expyear, expmonth, currentsalary, expectedsalary,
                    noticeperiod, reasonforchange
                } = req.body;

                // Upload resume to S3
                let resumeUrl = null;
                if (req.file) {
                    resumeUrl = await uploadToS3(req.file, 'resumes');
                }

                const companyId = process.env.DEFAULT_COMPANY_ID || 1;

                // Call sp_SubmitJobApplication
                const [result] = await db.raw('CALL sp_SubmitJobApplication(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                    uuidv4(),
                    requirementid,
                    applyjobname,
                    applyjobemail,
                    applyjobmobile,
                    resumeUrl,
                    currentlocation,
                    expyear || 0,
                    expmonth || 0,
                    currentsalary || null,
                    expectedsalary || null,
                    noticeperiod || 0,
                    reasonforchange || null,
                    companyId
                ]);

                const response = result[0] ? result[0][0] : {};

                res.json({
                    statusCode: 200,
                    msg: response.message || 'Application submitted successfully!',
                    applyjobid: response.applyjobid
                });
            } catch (error) {
                console.error('Apply error:', error);
                res.json({
                    statusCode: 500,
                    msg: 'Failed to submit application'
                });
            }
        }
    ],

    /**
     * NEWSLETTER - Using sp_SubscribeNewsletter
     */
    newsletter: async (req, res) => {
        try {
            const { email } = req.body;
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            // Call sp_SubscribeNewsletter
            const [result] = await db.raw('CALL sp_SubscribeNewsletter(?, ?, ?)', [
                uuidv4(),
                email,
                companyId
            ]);

            const response = result[0] ? result[0][0] : {};

            res.json({
                statusCode: response.statuscode === 1 ? 200 : 400,
                msg: response.message
            });
        } catch (error) {
            console.error('Newsletter error:', error);
            res.json({
                statusCode: 500,
                msg: 'Subscription failed'
            });
        }
    },

    /**
     * CONTACT FORM - Using sp_SubmitContactQuery
     */
    contactSubmit: async (req, res) => {
        try {
            const { name, email, mobile, subject, message } = req.body;
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            // Call sp_SubmitContactQuery
            const [result] = await db.raw('CALL sp_SubmitContactQuery(?, ?, ?, ?, ?, ?, ?)', [
                uuidv4(),
                name,
                email,
                mobile || null,
                subject || null,
                message,
                companyId
            ]);

            const response = result[0] ? result[0][0] : {};

            res.json({
                statusCode: 200,
                msg: response.message || 'Message sent successfully!'
            });
        } catch (error) {
            console.error('Contact error:', error);
            res.json({
                statusCode: 500,
                msg: 'Failed to send message'
            });
        }
    },

    /**
     * API: Get Technologies - Using sp_GetTechnologiesByCategory
     */
    getTechnologies: async (req, res) => {
        try {
            const categoryId = req.params.categoryId;
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            const [result] = await db.raw('CALL sp_GetTechnologiesByCategory(?, ?)', [categoryId, companyId]);

            res.json(result[0] || []);
        } catch (error) {
            res.json([]);
        }
    },

    /**
     * API: Get Locations - Using sp_GetLocationsByTechnology
     */
    getLocations: async (req, res) => {
        try {
            const technologyId = req.params.technologyId;
            const companyId = process.env.DEFAULT_COMPANY_ID || 1;

            const [result] = await db.raw('CALL sp_GetLocationsByTechnology(?, ?)', [technologyId, companyId]);

            res.json(result[0] || []);
        } catch (error) {
            res.json([]);
        }
    },

    // Static pages
    about: (req, res) => {
        res.render('home/about', {
            title: 'About Us',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    },

    contact: (req, res) => {
        res.render('home/contact', {
            title: 'Contact Us',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    },

    privacyPolicy: (req, res) => {
        res.render('home/privacy-policy', {
            title: 'Privacy Policy',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    },

    termsConditions: (req, res) => {
        res.render('home/terms-and-conditions', {
            title: 'Terms and Conditions',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    },

    cookiePolicy: (req, res) => {
        res.render('home/cookie-policy', {
            title: 'Cookie Policy',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    },

    doNotSell: (req, res) => {
        res.render('home/do-not-sell', {
            title: 'Do Not Sell My Personal Information',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    },

    faq: (req, res) => {
        res.render('home/faq', {
            title: 'Frequently Asked Questions',
            appName: 'RexJobs',
            user: req.session.user || null,
            currentPath: req.path
        });
    }
};

module.exports = homeController;
