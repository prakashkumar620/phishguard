const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Protect routes: requires valid JWT in cookie or Authorization header
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Check Cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Attach user to request
    let user;
    const { getConnectionStatus } = require('../config/db');
    if (getConnectionStatus()) {
      user = await User.findById(decoded.id).select('-passwordHash');
    } else {
      const { mockUsers } = require('../controllers/authController');
      user = mockUsers.find(u => String(u._id) === String(decoded.id));
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.'
      });
    }
    next(err);
  }
};

/**
 * Optional authentication: if token exists, populates req.user; otherwise proceeds as anonymous
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        let user;
        const { getConnectionStatus } = require('../config/db');
        if (getConnectionStatus()) {
          user = await User.findById(decoded.id).select('-passwordHash');
        } else {
          const { mockUsers } = require('../controllers/authController');
          user = mockUsers.find(u => String(u._id) === String(decoded.id));
        }
        if (user) {
          req.user = user;
        }
      } catch (tokenErr) {
        // Silently continue as anonymous if optional token is invalid/expired
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based authorization guard
 * Restricts access to administrators
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.'
    });
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};
