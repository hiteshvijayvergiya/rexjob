// routes/jobs.js - COMPLETE

const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');

// List jobs
router.get('/', jobsController.index);

// Create job form
router.get('/create', jobsController.create);

// Store job
router.post('/store', jobsController.store);

// Edit job form
router.get('/:id/edit', jobsController.edit);

// Update job
router.put('/:id', jobsController.update);

// Delete job
router.delete('/:id/delete', jobsController.delete);

module.exports = router;
