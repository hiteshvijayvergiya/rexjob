// routes/home.js - Public Home Routes
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const multer = require('multer');

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Public Routes
router.get('/', homeController.index);
router.get('/career', homeController.career);
router.get('/category/:seoname', homeController.category);
router.get('/job/:id', homeController.jobDetails);
router.get('/about', homeController.about);
router.get('/contact', homeController.contact);


// Policy & Information Pages
router.get('/privacy-policy', homeController.privacyPolicy);
router.get('/terms-and-conditions', homeController.termsConditions);
router.get('/cookie-policy', homeController.cookiePolicy);
router.get('/do-not-sell', homeController.doNotSell);
router.get('/faq', homeController.faq);

// Form Submissions
router.post('/apply', upload.single('resume'), homeController.applyJob);
router.post('/newsletter', homeController.newsletter);
router.post('/contact-submit', homeController.submitQuery);

// API Routes
router.get('/api/technologies/:categoryId', homeController.getTechnologies);
router.get('/api/locations/:technologyId', homeController.getLocations);

module.exports = router;
