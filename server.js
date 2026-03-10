// server.js
require('dotenv').config();
const express        = require('express');
const expressLayouts = require('express-ejs-layouts');
const session        = require('express-session');
const flash          = require('connect-flash');
const cookieParser   = require('cookie-parser');
const compression    = require('compression');
const helmet         = require('helmet');
const morgan         = require('morgan');
const path           = require('path');
const fs             = require('fs');

const routes = require('./routes/index');

const app = express();

// ── Trust proxy ──────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── View Engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads/resumes');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'rexjobs-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 120 // 2 hours
  }
}));

// ── Flash ─────────────────────────────────────────────────────────────────────
app.use(flash());

// ── Global Locals ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.success_msg   = req.flash('success_msg');
  res.locals.error_msg     = req.flash('error_msg');
  res.locals.error         = req.flash('error');
  res.locals.user          = req.session.user || null;
  res.locals.appName       = process.env.APP_NAME || 'RexJobs';
  res.locals.baseUrl       = process.env.BASE_URL || 'http://localhost:3000';
  res.locals.currentPath   = req.path;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', routes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error/404', { title: 'Not Found', message: 'Page not found.' });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).render('error/500', {
    title: 'Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════╗`);
  console.log(`║   RexJobs Server Started!        ║`);
  console.log(`╚══════════════════════════════════╝`);
  console.log(`🚀  http://localhost:${PORT}`);
  console.log(`⚙️   ENV: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
