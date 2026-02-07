// routes/candidates.js - COMPLETE

const express = require('express');
const router = express.Router();
const candidatesController = require('../controllers/candidatesController');

// List candidates
router.get('/', candidatesController.index);

// View candidate
router.get('/:id', candidatesController.view);

module.exports = router;
