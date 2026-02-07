// routes/dashboard.js - Dashboard Routes
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(isAuthenticated);

router.get('/', dashboardController.index);

module.exports = router;
