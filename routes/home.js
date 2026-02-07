// routes/home.js - COMPLETE WITH ALL ROUTES

const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Homepage
router.get('/', homeController.index);

// Career/Browse Jobs
router.get('/career', homeController.career);

// Category Page
router.get('/category/:seoname', homeController.category);

// Job Details
router.get('/job/:id', homeController.jobDetails);

// Apply for Job
router.post('/apply', homeController.apply);

// Newsletter Subscription
router.post('/newsletter', homeController.newsletter);

// Contact Form
router.post('/contact-submit', homeController.contactSubmit);

// API Endpoints
router.get('/api/technologies/:categoryId', homeController.getTechnologies);
router.get('/api/locations/:technologyId', homeController.getLocations);

// Static Pages
router.get('/about', homeController.about);
router.get('/contact', homeController.contact);
router.get('/privacy-policy', homeController.privacyPolicy);
router.get('/terms-and-conditions', homeController.termsConditions);
router.get('/cookie-policy', homeController.cookiePolicy);
router.get('/do-not-sell', homeController.doNotSell);
router.get('/faq', homeController.faq);

module.exports = router;
