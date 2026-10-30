const express = require('express');
const router = express.Router();
const { getSummary, getTrends, getMongoStats } = require('../controllers/analyticsController');

// Summary analytics
router.get('/summary', getSummary);

// Temporal and indicator trends
router.get('/trends', getTrends);

// Live MongoDB database stats & collection counts
router.get('/db-stats', getMongoStats);

module.exports = router;
