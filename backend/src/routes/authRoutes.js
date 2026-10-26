const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Registration with rate limiting
router.post('/register', authLimiter, register);

// Login with rate limiting
router.post('/login', authLimiter, login);

// Logout
router.post('/logout', logout);

// Get current profile
router.get('/me', requireAuth, getMe);

module.exports = router;
