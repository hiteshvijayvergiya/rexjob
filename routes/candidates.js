// routes/candidates.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', (req, res) => {
  res.render('candidates/index', { title: 'Candidates' });
});

module.exports = router;
