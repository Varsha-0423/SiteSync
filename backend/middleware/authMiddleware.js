const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
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
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Supervisor middleware
const supervisor = (req, res, next) => {
  if (req.user && (req.user.role === 'supervisor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a supervisor' });
  }
};

// Admin or Supervisor middleware
const adminOrSupervisor = (req, res, next) => {
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
    protect(req, res, (err) => {
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

// Export all middleware functions
module.exports = {
  protect,
  admin,
  supervisor,
  adminOrSupervisor,
  auth
};