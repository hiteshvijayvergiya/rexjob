// routes/jobs.js - Job Management Routes
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', (req, res) => {
  res.render('jobs/index', { title: 'Manage Jobs' });
});

router.get('/create', (req, res) => {
  res.render('jobs/create', { title: 'Post New Job' });
});

module.exports = router;
