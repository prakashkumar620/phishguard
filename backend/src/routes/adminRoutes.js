const express = require('express');
const router = express.Router();
const { getUsers, getModelMetrics, getAuditLogs } = require('../controllers/adminController');
const { getAdminFeedback, updateFeedbackStatus } = require('../controllers/feedbackController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All admin routes mandate authentication & admin role guard
router.use(requireAuth, requireAdmin);

// User roster
router.get('/users', getUsers);

// ML model performance metrics
router.get('/model-metrics', getModelMetrics);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Community feedback review
router.get('/feedback', getAdminFeedback);
router.patch('/feedback/:id', updateFeedbackStatus);

module.exports = router;
