const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.'
  }
});

/**
 * Strict authentication rate limiter (login / register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

/**
 * URL Scanning rate limiter
 */
const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 scans per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Scan frequency limit exceeded. Please wait a minute before analyzing more URLs.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  scanLimiter
};
