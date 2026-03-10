// middleware/auth.js
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) return next();
  req.flash('error_msg', 'Please login to access this page');
  res.redirect('/account/login');
};

const isAdmin = (req, res, next) => {
  if (req.session?.user?.isadmin || req.session?.user?.issuperadmin) return next();
  req.flash('error_msg', 'Admin access required');
  res.redirect('/');
};

// Employer: usertypeid=3 (or admin also allowed)
const isEmployer = (req, res, next) => {
  const u = req.session?.user;
  if (u && (u.usertypeid === 3 || u.isadmin || u.issuperadmin)) return next();
  req.flash('error_msg', 'Employer access required');
  res.redirect('/account/login');
};

module.exports = { isAuthenticated, isAdmin, isEmployer };
