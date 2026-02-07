// server.js - Main Application Entry Point
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const homeRoutes = require('./routes/home');
const accountRoutes = require('./routes/account');
const dashboardRoutes = require('./routes/dashboard');
const jobRoutes = require('./routes/jobs');
const candidateRoutes = require('./routes/candidates');
const applicationRoutes = require('./routes/applications');

// Import database
const db = require('./config/database');

// Initialize Express App
const app = express();

// Trust proxy (for AWS, Heroku, etc.)
app.set('trust proxy', 1);

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 120 // 120 minutes
  }
}));

// Flash Messages
app.use(flash());

// Global Variables for Views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  res.locals.companyId = req.session.companyId || process.env.DEFAULT_COMPANY_ID || 1;
  res.locals.appName = process.env.APP_NAME || 'RexJobs';
  res.locals.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  next();
});

// Routes
app.use('/', homeRoutes);
app.use('/account', accountRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/jobs', jobRoutes);
app.use('/candidates', candidateRoutes);
app.use('/applications', applicationRoutes);

// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).render('error/404', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log error to database
  db('ErrorLog').insert({
    uuid: require('uuid').v4(),
    ErrorMsg: err.message,
    InnerException: err.stack,
    IpAddress: req.ip,
    UserId: req.session.user ? req.session.user.userid : null,
    CreatedDate: new Date(),
    Controller: req.path.split('/')[1] || 'Unknown',
    Action: req.path.split('/')[2] || 'Unknown',
    LineNumber: err.lineNumber || null,
    companyid: req.session.companyId || 1
  }).catch(console.error);
  
  res.status(err.status || 500).render('error/500', {
    title: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     RexJobs Server Started!           ║
╚═══════════════════════════════════════╝
  
  🚀 Server running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📍 URL: http://localhost:${PORT}
  
  Press CTRL+C to stop
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.destroy(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
