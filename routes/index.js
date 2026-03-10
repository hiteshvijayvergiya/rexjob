// routes/index.js
const express            = require('express');
const router             = express.Router();
const adminController    = require('../controllers/adminController');
const { frontController }  = require('../controllers/frontController');
const accountController  = require('../controllers/accountController');
const employerController = require('../controllers/employerController');
const { isAuthenticated, isAdmin, isEmployer } = require('../middleware/auth');

// ════════════════════════════════════════════════════════════════════════════
//  ACCOUNT
// ════════════════════════════════════════════════════════════════════════════
router.get('/account/login',                 accountController.loginPage);
router.post('/account/login',                accountController.login);
router.get('/account/signup',                accountController.signupPage);
router.post('/account/signup',               accountController.signup);
router.get('/account/forgot-password',       accountController.forgotPasswordPage);
router.post('/account/forgot-password',      accountController.forgotPassword);
router.get('/account/reset-password/:token', accountController.resetPasswordPage);
router.post('/account/reset-password',       accountController.resetPassword);
router.get('/account/logout',                isAuthenticated, accountController.logout);
router.get('/account/profile',               isAuthenticated, accountController.profilePage);
router.post('/account/profile',              isAuthenticated, accountController.updateProfile);

// ════════════════════════════════════════════════════════════════════════════
//  EMPLOYER PORTAL  (usertypeid=3)
// ════════════════════════════════════════════════════════════════════════════
router.get('/employer/dashboard',            isAuthenticated, isEmployer, employerController.dashboard);
router.get('/employer/jobs/create',          isAuthenticated, isEmployer, employerController.jobCreate);
router.post('/employer/jobs/store',          isAuthenticated, isEmployer, employerController.jobStore);
router.get('/employer/jobs/:id/edit',        isAuthenticated, isEmployer, employerController.jobEdit);
router.post('/employer/jobs/:id/update',     isAuthenticated, isEmployer, employerController.jobUpdate);
router.get('/employer/jobs/:id',             isAuthenticated, isEmployer, employerController.jobDetail);

// ════════════════════════════════════════════════════════════════════════════
//  FRONT USER DASHBOARD (candidates)
// ════════════════════════════════════════════════════════════════════════════
router.get('/user/dashboard',   isAuthenticated, frontController.userDashboard);
router.get('/my-applications',  isAuthenticated, frontController.myApplications);

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC FRONT
// ════════════════════════════════════════════════════════════════════════════
router.get('/',                       frontController.home);
router.get('/jobs/category',          frontController.categoryBrowse);
router.get('/jobs/category/:id',      frontController.categoryBrowse);
router.get('/jobs/:id',               frontController.jobDetail);
router.get('/apply',                  frontController.applyForm);
router.post('/apply',                 ...frontController.applySubmit);
router.get('/thank-you',              frontController.thankYou);
router.get('/about',                  frontController.about);
router.get('/contact',                frontController.contact);
router.get('/privacy-policy',         frontController.privacyPolicy);
router.get('/terms-and-conditions',   frontController.termsConditions);

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════════════════════════════
router.get('/admin/dashboard',                 isAuthenticated, isAdmin, adminController.dashboard);

// Categories
router.get('/admin/categories',                isAuthenticated, isAdmin, adminController.categoryList);
router.get('/admin/categories/create',         isAuthenticated, isAdmin, adminController.categoryCreate);
router.post('/admin/categories/store',         isAuthenticated, isAdmin, adminController.categoryStore);
router.get('/admin/categories/:id/edit',       isAuthenticated, isAdmin, adminController.categoryEdit);
router.post('/admin/categories/:id/update',    isAuthenticated, isAdmin, adminController.categoryUpdate);
router.delete('/admin/categories/:id/delete',  isAuthenticated, isAdmin, adminController.categoryDelete);

// Jobs
router.get('/admin/jobs',                      isAuthenticated, isAdmin, adminController.jobList);
router.get('/admin/jobs/create',               isAuthenticated, isAdmin, adminController.jobCreate);
router.post('/admin/jobs/store',               isAuthenticated, isAdmin, adminController.jobStore);
router.post('/admin/jobs/approve',             isAuthenticated, isAdmin, adminController.jobApprove);
router.get('/admin/jobs/:id/edit',             isAuthenticated, isAdmin, adminController.jobEdit);
router.post('/admin/jobs/:id/update',          isAuthenticated, isAdmin, adminController.jobUpdate);
router.delete('/admin/jobs/:id/delete',        isAuthenticated, isAdmin, adminController.jobDelete);

// Applications
router.get('/admin/applications',              isAuthenticated, isAdmin, adminController.applicationList);
router.get('/admin/applications/:id',          isAuthenticated, isAdmin, adminController.applicationView);
router.post('/admin/applications/status',      isAuthenticated, isAdmin, adminController.applicationStatus);

module.exports = router;
