const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Supervisor middleware
exports.supervisor = (req, res, next) => {
  if (req.user && (req.user.role === 'supervisor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a supervisor' });
  }
};

// Admin or Supervisor middleware
exports.adminOrSupervisor = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin or supervisor' });
  }
};

// Role-based authorization wrapper
const auth = (roles = []) => {
  return (req, res, next) => {
    // First run protect middleware to verify token and get user
    exports.protect(req, res, (err) => {
      if (err) return; // Error already handled by protect
      
      // Check if user has required role
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: `Not authorized. Required roles: ${roles.join(', ')}` 
        });
      }
      
      next();
    });
  };
};

// Export both the individual functions and the wrapper
module.exports = auth;
// Also export as properties for backward compatibility
module.exports.protect = exports.protect;
module.exports.admin = exports.admin;
module.exports.supervisor = exports.supervisor;
module.exports.adminOrSupervisor = exports.adminOrSupervisor;