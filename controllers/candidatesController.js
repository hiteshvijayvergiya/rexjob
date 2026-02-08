// controllers/candidatesController.js - SIMPLE: Only Apply Form (NO EDIT/DELETE/UPDATE)

const db = require('../config/database');
const { uploadToS3 } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');

// Multer config for resume upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files allowed'));
    }
  }
});

const candidatesController = {
  
  // Show Apply Form
  applyForm: async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const companyId = process.env.DEFAULT_COMPANY_ID || 1;

      // Get job details
      const job = await db('tblrequirement as r')
        .join('tblrequirementtype as rt', 'r.requirementtypeid', 'rt.requirementtypeid')
        .join('tblrequirementposition as rp', 'r.requirementpositionid', 'rp.requirementpositionid')
        .join('tblcity as c', 'r.requirementcity', 'c.id')
        .select(
          'r.requirementid',
          'r.requirementname',
          'r.requirementdescription',
          'r.expstart',
          'r.expend',
          'r.salarystart',
          'r.salaryend',
          'rt.requirementtypeid',
          'rt.requirementtypename',
          'rp.requirementpositionname',
          'c.name as cityname'
        )
        .where('r.requirementid', jobId)
        .where('r.companyid', companyId)
        .first();

      if (!job) {
        return res.status(404).render('error/404', { title: 'Job Not Found' });
      }

      res.render('candidates/apply', {
        title: `Apply for ${job.requirementname}`,
        job
      });
    } catch (error) {
      console.error('Apply form error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // Submit Application
  submitApplication: [
    upload.single('resume'),
    async (req, res) => {
      try {
        const {
          requirementid,
          applyjobname,
          applyjobemail,
          applyjobmobile,
          currentlocation,
          expyear,
          expmonth,
          currentsalary,
          expectedsalary,
          noticeperiod,
          reasonforchange,
          candidateskill,
          candidatequalification
        } = req.body;

        const companyId = process.env.DEFAULT_COMPANY_ID || 1;

        // Upload resume to S3
        let resumeUrl = null;
        if (req.file) {
          resumeUrl = await uploadToS3(req.file, 'resumes');
        }

        // Insert into tblapplyjob
        await db('tblapplyjob').insert({
          uuid: uuidv4(),
          requirementid,
          applyjobname,
          applyjobemail,
          applyjobmobile,
          currentlocation,
          expyear: expyear || 0,
          expmonth: expmonth || 0,
          currentsalary,
          expectedsalary,
          noticeperiod: noticeperiod || 0,
          reasonforchange,
          applyjobresume: resumeUrl,
          addeddate: db.fn.now(),
          isactive: true,
          isdeleted: false,
          companyid: companyId
        });

        // Insert/Update candidate
        const existingCandidate = await db('tblcandidate')
          .where('candidateemail', applyjobemail)
          .where('companyid', companyId)
          .first();

        if (!existingCandidate) {
          // Create new candidate
          await db('tblcandidate').insert({
            uuid: uuidv4(),
            candidatename: applyjobname,
            candidateemail: applyjobemail,
            candidatemobile: applyjobmobile,
            candidateexp: (parseInt(expyear) || 0) + (parseInt(expmonth) || 0) / 12,
            candidateskill: candidateskill,
            candidatequalification: candidatequalification,
            candidatecurrentctc: currentsalary,
            candidateexpectedctc: expectedsalary,
            candidateresume: resumeUrl,
            companyid: companyId,
            isactive: true,
            isdeleted: false,
            addeddate: db.fn.now()
          });
        } else {
          // Update existing candidate with latest info
          await db('tblcandidate')
            .where('candidateid', existingCandidate.candidateid)
            .update({
              candidatename: applyjobname,
              candidatemobile: applyjobmobile,
              candidateexp: (parseInt(expyear) || 0) + (parseInt(expmonth) || 0) / 12,
              candidateskill: candidateskill,
              candidatequalification: candidatequalification,
              candidatecurrentctc: currentsalary,
              candidateexpectedctc: expectedsalary,
              candidateresume: resumeUrl || existingCandidate.candidateresume,
              updateddate: db.fn.now()
            });
        }

        res.json({
          statusCode: 200,
          msg: 'Application submitted successfully!'
        });
      } catch (error) {
        console.error('Submit application error:', error);
        res.json({
          statusCode: 500,
          msg: 'Failed to submit application. Please try again.'
        });
      }
    }
  ],

  // Thank You Page
  thankYou: (req, res) => {
    res.render('candidates/thank-you', {
      title: 'Application Submitted'
    });
  }
};

module.exports = candidatesController;
