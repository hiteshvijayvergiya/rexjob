// routes/applications.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', (req, res) => {
  res.render('applications/index', { title: 'Applications' });
});

module.exports = router;
