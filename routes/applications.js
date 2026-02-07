// routes/applications.js - COMPLETE

const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applicationsController');

// List applications
router.get('/', applicationsController.index);

// View application
router.get('/:id', applicationsController.view);

// Update status
router.post('/update-status', applicationsController.updateStatus);

module.exports = router;
