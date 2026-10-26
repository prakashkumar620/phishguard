const express = require('express');
const router = express.Router();
const {
  createScan,
  getScans,
  getScanById,
  deleteScan,
  exportScansCsv
} = require('../controllers/scanController');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { scanLimiter } = require('../middleware/rateLimiter');

// Scan URL endpoint with rate limiting and optional user association
router.post('/', scanLimiter, optionalAuth, createScan);

// CSV Export endpoint (must be declared before :id route)
router.get('/export/csv', optionalAuth, exportScansCsv);

// List scan history with filtering, searching, and pagination
router.get('/', optionalAuth, getScans);

// Individual scan details
router.get('/:id', optionalAuth, getScanById);

// Delete scan record (requires authentication and ownership)
router.delete('/:id', requireAuth, deleteScan);

module.exports = router;
