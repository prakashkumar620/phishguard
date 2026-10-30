const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const { evaluateRules } = require('../services/ruleEngine');
const { predictPhishingLikelihood } = require('../services/mlService');
const { checkThreatIntelligence } = require('../services/threatIntelService');
const { profileThreat } = require('../services/threatProfiler');
const { getConnectionStatus } = require('../config/db');

// In-memory fallback cache for scans when DB is disconnected/in mock dev mode
const mockScansStore = [];

/**
 * @desc    Submit a URL for phishing assessment
 * @route   POST /api/scans
 * @access  Public (Optional User Auth)
 */
const createScan = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid URL to scan.'
      });
    }

    // 1. Execute rule-based analysis
    const evaluation = evaluateRules(url);

    if (!evaluation.success) {
      return res.status(400).json({
        success: false,
        message: evaluation.error || 'Invalid URL supplied for analysis.'
      });
    }

    // 2. Execute Machine Learning Classification
    const mlResult = await predictPhishingLikelihood(evaluation.normalizedUrl, evaluation.features);

    // 3. Execute Threat Intelligence Check
    const intelResult = await checkThreatIntelligence(evaluation.normalizedUrl);

    // Detection methods list
    const detectionMethods = ['rule-based'];
    if (mlResult.isAvailable) {
      detectionMethods.push('machine-learning');
    }
    if (intelResult.isConfigured && intelResult.status !== 'service_disabled') {
      detectionMethods.push('threat-intelligence');
    }

    const modelPrediction = mlResult.prediction;
    const modelConfidence = mlResult.confidence;
    const threatIntelStatus = intelResult.status;
    const threatIntelDetails = intelResult;

    const indicators = [...evaluation.indicators];

    // If verified by Threat Intelligence, elevate to confirmed high threat
    let compositeScore = evaluation.riskScore;
    if (intelResult.isThreat) {
      compositeScore = 100;
      indicators.unshift({
        id: 'THREAT_INTEL_MATCH',
        name: `Confirmed Threat Intelligence (${intelResult.threatTypes.join(', ')})`,
        severity: 'critical',
        weight: 100,
        description: 'URL matched malicious threat signatures on Google Safe Browsing reputation feeds.'
      });
    } else if (modelPrediction === 'phishing' && modelConfidence > 0.8 && compositeScore < 50) {
      compositeScore = Math.min(100, compositeScore + 25);
    }

    let riskCategory = 'low';
    if (compositeScore >= 70) riskCategory = 'high';
    else if (compositeScore >= 40) riskCategory = 'medium';

    const threatProfile = profileThreat({
      normalizedUrl: evaluation.normalizedUrl,
      hostname: evaluation.hostname,
      pathname: evaluation.pathname || '',
      search: evaluation.search || '',
      features: evaluation.features,
      riskScore: compositeScore,
      indicators
    });

    let explanation = evaluation.explanation;
    if (compositeScore !== evaluation.riskScore) {
      if (riskCategory === 'high') {
        explanation = `High risk detected (Composite Score: ${compositeScore}/100). The URL exhibits ${indicators.length} suspicious signals including ${indicators.filter(i => i.severity === 'critical').map(i => i.name).join(', ') || 'anomalous security indicators'}. Exercise extreme caution; this URL possesses strong characteristics of a phishing attempt.`;
      } else if (riskCategory === 'medium') {
        explanation = `Medium risk detected (Composite Score: ${compositeScore}/100). The URL triggered ${indicators.length} warning signals (${indicators.map(i => i.name).slice(0, 3).join(', ')}). While not definitively confirmed as malicious, caution is advised before entering credentials.`;
      } else {
        explanation = `Low risk estimated (Composite Score: ${compositeScore}/100). No critical phishing indicators were identified. Note: An assessment of low risk is not a guarantee of safety. Always verify the source and domain authenticity.`;
      }
    }

    const scanData = {
      userId: req.user ? req.user._id : null,
      submittedUrl: url.trim(),
      normalizedUrl: evaluation.normalizedUrl,
      hostname: evaluation.hostname,
      riskCategory,
      riskScore: compositeScore,
      indicators,
      detectionMethods,
      modelPrediction,
      modelConfidence,
      threatIntelStatus,
      threatIntelDetails,
      threatProfile,
      explanation,
      scannedAt: new Date()
    };

    let savedScan;
    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;

    if (isDbReady) {
      savedScan = await Scan.create(scanData);
    } else {
      // In-memory mock fallback for offline local testing
      savedScan = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...scanData,
        createdAt: scanData.scannedAt,
        updatedAt: scanData.scannedAt
      };
      mockScansStore.unshift(savedScan);
      // Keep store under 100 items
      if (mockScansStore.length > 100) mockScansStore.pop();
    }

    res.status(201).json({
      success: true,
      message: 'URL analysis completed successfully.',
      data: savedScan
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Retrieve scan history with pagination, search, and category filtering
 * @route   GET /api/scans
 * @access  Public / Authenticated
 */
const getScans = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { domain, riskCategory, sortBy = 'scannedAt', sortOrder = 'desc' } = req.query;

    const query = {};

    // If authenticated user (non-admin), restrict to their own scans
    if (req.user && req.user.role !== 'admin') {
      query.userId = req.user._id;
    } else if (!req.user) {
      // For anonymous users, return recent public/anonymous scans
      query.userId = null;
    }

    // Filter by domain/hostname
    if (domain) {
      query.hostname = { $regex: domain.trim(), $options: 'i' };
    }

    // Filter by riskCategory
    if (riskCategory && ['low', 'medium', 'high'].includes(riskCategory.toLowerCase())) {
      query.riskCategory = riskCategory.toLowerCase();
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;

    if (isDbReady) {
      const [scans, total] = await Promise.all([
        Scan.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
        Scan.countDocuments(query)
      ]);

      return res.status(200).json({
        success: true,
        count: scans.length,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        data: scans
      });
    }

    // Standalone memory fallback filtering
    let filtered = [...mockScansStore];
    if (req.user && req.user.role !== 'admin') {
      filtered = filtered.filter(s => String(s.userId) === String(req.user._id));
    }
    if (domain) {
      filtered = filtered.filter(s => s.hostname.toLowerCase().includes(domain.toLowerCase()));
    }
    if (riskCategory) {
      filtered = filtered.filter(s => s.riskCategory === riskCategory.toLowerCase());
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: paginated.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get detailed individual scan report by ID
 * @route   GET /api/scans/:id
 * @access  Public / Authenticated
 */
const getScanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scan ID format.'
      });
    }

    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;
    let scan;

    if (isDbReady) {
      scan = await Scan.findById(id);
    } else {
      scan = mockScansStore.find(s => String(s._id) === String(id));
    }

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan record not found.'
      });
    }

    // Ownership check: if scan belongs to a specific user, verify requester
    if (scan.userId) {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access this scan report.'
        });
      }

      const isOwner = String(scan.userId) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view another user\'s scan record.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: scan
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete scan record
 * @route   DELETE /api/scans/:id
 * @access  Protected (Scan Owner or Admin)
 */
const deleteScan = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scan ID format.'
      });
    }

    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;
    let scan;

    if (isDbReady) {
      scan = await Scan.findById(id);
    } else {
      scan = mockScansStore.find(s => String(s._id) === String(id));
    }

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan record not found.'
      });
    }

    // Enforce ownership: anonymous scans cannot be deleted via API
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to delete scan records.'
      });
    }

    const isOwner = scan.userId && String(scan.userId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own scan records.'
      });
    }

    if (isDbReady) {
      await Scan.findByIdAndDelete(id);
    } else {
      const idx = mockScansStore.findIndex(s => String(s._id) === String(id));
      if (idx !== -1) mockScansStore.splice(idx, 1);
    }

    res.status(200).json({
      success: true,
      message: 'Scan record deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Export user's scan history as CSV file
 * @route   GET /api/scans/export/csv
 * @access  Public / Authenticated
 */
const exportScansCsv = async (req, res, next) => {
  try {
    const query = {};
    if (req.user && req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;
    let scans;

    if (isDbReady) {
      scans = await Scan.find(query).sort({ scannedAt: -1 }).limit(1000).lean();
    } else {
      scans = [...mockScansStore];
      if (req.user && req.user.role !== 'admin') {
        scans = scans.filter(s => String(s.userId) === String(req.user._id));
      }
    }

    // Build CSV formatted text
    const headers = ['Scan ID', 'Submitted URL', 'Hostname', 'Risk Category', 'Risk Score', 'Scanned At', 'Indicators Triggered'];
    const rows = scans.map(s => {
      const indicatorsList = (s.indicators || []).map(i => i.name).join('; ');
      return [
        `"${s._id}"`,
        `"${(s.submittedUrl || '').replace(/"/g, '""')}"`,
        `"${(s.hostname || '').replace(/"/g, '""')}"`,
        `"${s.riskCategory}"`,
        `"${s.riskScore}"`,
        `"${new Date(s.scannedAt).toISOString()}"`,
        `"${indicatorsList.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="phishguard_scans_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createScan,
  getScans,
  getScanById,
  deleteScan,
  exportScansCsv,
  mockScansStore
};
