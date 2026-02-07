// middleware/auth.js - Authentication Middleware
const db = require('../config/database');

/**
 * Check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please login to access this page');
  res.redirect('/account/login');
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isadmin) {
    return next();
  }
  req.flash('error_msg', 'Access denied. Admin privileges required.');
  res.redirect('/dashboard');
};

/**
 * Check if user is super admin
 */
const isSuperAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.issuperadmin) {
    return next();
  }
  req.flash('error_msg', 'Access denied. Super Admin privileges required.');
  res.redirect('/dashboard');
};

/**
 * Load user permissions from Rights table
 */
const loadUserPermissions = async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  try {
    const userTypeId = req.session.user.usertypeid;
    
    const rights = await db('Rights as r')
      .join('Menu as m', 'm.MenuId', 'r.MenuId')
      .select(
        'm.MenuId',
        'm.MenuName',
        'm.Controller',
        'm.Action',
        'm.ParentId',
        'r.Add',
        'r.Edit',
        'r.Delete',
        'r.View',
        'r.Print',
        'r.IsShowAll'
      )
      .where('r.UserTypeId', userTypeId)
      .whereNull('r.IsDeleted')
      .orWhere('r.IsDeleted', false)
      .orderBy(['m.ParentId', 'm.Sequence']);
    
    req.session.userPermissions = rights;
    res.locals.userPermissions = rights;
    
    next();
  } catch (error) {
    console.error('Error loading user permissions:', error);
    next();
  }
};

/**
 * Check specific permission for a menu/action
 */
const hasPermission = (controller, action, permissionType = 'View') => {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error_msg', 'Please login to access this page');
      return res.redirect('/account/login');
    }

    // Super admin has all permissions
    if (req.session.user.issuperadmin) {
      return next();
    }

    const permissions = req.session.userPermissions || [];
    const hasAccess = permissions.some(p => 
      p.Controller === controller && 
      p.Action === action && 
      p[permissionType] === true
    );

    if (hasAccess) {
      return next();
    }

    req.flash('error_msg', 'You do not have permission to access this resource');
    res.redirect('/dashboard');
  };
};

/**
 * Track user activity
 */
const logActivity = (menuId, action) => {
  return async (req, res, next) => {
    if (req.session.user) {
      try {
        await db('ActivityLog').insert({
          ActivityLog: action,
          MenuId: menuId,
          UserId: req.session.user.userid,
          RecordId: req.params.id || null,
          CreatedBy: req.session.user.userid,
          CreatedDate: new Date(),
          companyid: req.session.companyId || 1
        });
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    }
    next();
  };
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isSuperAdmin,
  loadUserPermissions,
  hasPermission,
  logActivity
};
