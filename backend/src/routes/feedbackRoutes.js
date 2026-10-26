const express = require('express');
const router = express.Router();
const { submitFeedback } = require('../controllers/feedbackController');
const { optionalAuth } = require('../middleware/auth');

// Submit user feedback report
router.post('/', optionalAuth, submitFeedback);

module.exports = router;
