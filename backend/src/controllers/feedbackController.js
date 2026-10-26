const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Scan = require('../models/Scan');
const AuditLog = require('../models/AuditLog');
const { getConnectionStatus } = require('../config/db');

const mockFeedbackStore = [];

/**
 * @desc    Submit feedback on a scan assessment (false positive / false negative)
 * @route   POST /api/feedback
 * @access  Public / Authenticated
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { scanId, feedbackType, description } = req.body;

    if (!scanId || !feedbackType || !description) {
      return res.status(400).json({
        success: false,
        message: 'scanId, feedbackType, and description are required.'
      });
    }

    if (!['false_positive', 'false_negative', 'incorrect_indicator'].includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedbackType. Must be false_positive, false_negative, or incorrect_indicator.'
      });
    }

    const isDbReady = getConnectionStatus();

    const feedbackData = {
      scanId,
      userId: req.user ? req.user._id : null,
      feedbackType,
      description: description.trim(),
      reviewStatus: 'pending',
      createdAt: new Date()
    };

    let savedFeedback;
    if (isDbReady) {
      savedFeedback = await Feedback.create(feedbackData);
    } else {
      savedFeedback = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...feedbackData
      };
      mockFeedbackStore.unshift(savedFeedback);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. It has been logged for security review.',
      data: savedFeedback
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all submitted feedback (Admin Only)
 * @route   GET /api/admin/feedback
 * @access  Admin Protected
 */
const getAdminFeedback = async (req, res, next) => {
  try {
    const isDbReady = getConnectionStatus();
    let reports = [];

    if (isDbReady) {
      reports = await Feedback.find()
        .populate('userId', 'name email role')
        .populate('scanId', 'submittedUrl hostname riskCategory riskScore')
        .sort({ createdAt: -1 })
        .limit(100);
    } else {
      reports = [...mockFeedbackStore];
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update feedback status (e.g. reviewed, dismissed)
 * @route   PATCH /api/admin/feedback/:id
 * @access  Admin Protected
 */
const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewStatus, adminNotes } = req.body;

    if (!['pending', 'reviewed', 'dismissed'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reviewStatus value.'
      });
    }

    const isDbReady = getConnectionStatus();
    let updated;

    if (isDbReady) {
      updated = await Feedback.findByIdAndUpdate(
        id,
        {
          reviewStatus,
          adminNotes: adminNotes || '',
          reviewedBy: req.user ? req.user._id : null,
          reviewedAt: new Date()
        },
        { new: true }
      );

      // Create Audit Log
      await AuditLog.create({
        actorId: req.user ? req.user._id : null,
        action: 'UPDATE_FEEDBACK_STATUS',
        targetType: 'Feedback',
        targetId: id,
        metadata: { reviewStatus, adminNotes }
      });
    } else {
      const fb = mockFeedbackStore.find(f => String(f._id) === String(id));
      if (fb) {
        fb.reviewStatus = reviewStatus;
        fb.adminNotes = adminNotes || '';
        updated = fb;
      }
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Feedback record not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback,
  getAdminFeedback,
  updateFeedbackStatus,
  mockFeedbackStore
};
