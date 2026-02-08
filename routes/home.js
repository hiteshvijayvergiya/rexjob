// routes/home.js - SIMPLE ROUTES

const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Homepage
router.get('/', homeController.index);

// Categories page (parent categories only)
router.get('/categories', homeController.categories);

// Category jobs page (jobs in clicked category)
router.get('/category/:id/jobs', homeController.categoryJobs);

// Job details
router.get('/job/:id', homeController.jobDetails);

// Static pages
router.get('/about', homeController.about);
router.get('/about', homeController.about);
router.get('/contact', homeController.contact);
router.get('/privacy-policy', homeController.privacyPolicy);
router.get('/terms-and-conditions', homeController.termsConditions);
router.get('/cookie-policy', homeController.cookiePolicy);
router.get('/do-not-sell', homeController.doNotSell);
router.get('/faq', homeController.faq);

module.exports = router;
