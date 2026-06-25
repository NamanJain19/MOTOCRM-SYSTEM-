const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    // For API endpoints, return JSON
    if (req.accepts('json') && !req.accepts('html')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // For pages, redirect to login
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware to check if user is NOT authenticated
const isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  next();
};

// Middleware to check user role
const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userRole) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!allowedRoles.includes(req.session.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware to set user info in res.locals for views
const setUserLocals = async (req, res, next) => {
  if (req.session && req.session.userId) {
    // Check if user session cache exists
    if (req.session.userName) {
      res.locals.isAuthenticated = true;
      res.locals.user = {
        id: req.session.userId.toString(),
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole,
        phone: req.session.userPhone || '',
        avatar: req.session.userAvatar || ''
      };
      return next();
    }

    try {
      const user = await User.findById(req.session.userId).lean();
      if (user) {
        res.locals.isAuthenticated = true;
        res.locals.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          avatar: user.avatar || ''
        };
        // Update session info to keep it in sync and cached
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;
        req.session.userPhone = user.phone || '';
        req.session.userAvatar = user.avatar || '';
      } else {
        res.locals.isAuthenticated = false;
        res.locals.user = null;
      }
    } catch (error) {
      console.error('Error fetching user in setUserLocals:', error);
      res.locals.isAuthenticated = false;
      res.locals.user = null;
    }
  } else {
    res.locals.isAuthenticated = false;
    res.locals.user = null;
  }
  next();
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  hasRole,
  setUserLocals
};
