// routes/account.js - Authentication Routes
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/login', accountController.loginPage);
router.post('/login', accountController.login);
router.get('/signup', accountController.signupPage);
router.post('/signup', accountController.signup);
router.get('/forgot-password', accountController.forgotPasswordPage);
router.post('/forgot-password', accountController.forgotPassword);
router.get('/reset-password/:token', accountController.resetPasswordPage);
router.post('/reset-password', accountController.resetPassword);

// Protected routes
router.get('/logout', isAuthenticated, accountController.logout);
router.get('/profile', isAuthenticated, accountController.profilePage);
router.post('/profile', isAuthenticated, accountController.updateProfile);

module.exports = router;
