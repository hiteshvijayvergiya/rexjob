// routes/candidate.js - SIMPLE CANDIDATE ROUTES (NO EDIT/DELETE)

const express = require('express');
const router = express.Router();
const candidatesController = require('../controllers/candidatesController');

// Apply form
router.get('/apply/:jobId', candidatesController.applyForm);

// Submit application
router.post('/submit', candidatesController.submitApplication);

// Thank you page
router.get('/thank-you', candidatesController.thankYou);

module.exports = router;
