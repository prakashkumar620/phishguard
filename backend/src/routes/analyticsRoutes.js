const express = require('express');
const router = express.Router();
const { getSummary, getTrends } = require('../controllers/analyticsController');

// Summary analytics
router.get('/summary', getSummary);

// Temporal and indicator trends
router.get('/trends', getTrends);

module.exports = router;
