const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const { getConnectionStatus } = require('../config/db');
const { mockScansStore } = require('./scanController');

/**
 * @desc    Get aggregate scan statistics and risk distributions
 * @route   GET /api/analytics/summary
 * @access  Public
 */
const getSummary = async (req, res, next) => {
  try {
    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;

    let totalScans = 0;
    let lowCount = 0;
    let mediumCount = 0;
    let highCount = 0;
    let avgScore = 0;

    if (isDbReady) {
      const counts = await Scan.aggregate([
        {
          $group: {
            _id: '$riskCategory',
            count: { $sum: 1 },
            avgScore: { $avg: '$riskScore' }
          }
        }
      ]);

      const totalResult = await Scan.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, overallAvg: { $avg: '$riskScore' } } }
      ]);

      totalScans = totalResult[0]?.total || 0;
      avgScore = Math.round(totalResult[0]?.overallAvg || 0);

      counts.forEach(c => {
        if (c._id === 'low') lowCount = c.count;
        if (c._id === 'medium') mediumCount = c.count;
        if (c._id === 'high') highCount = c.count;
      });
    } else {
      totalScans = mockScansStore.length;
      lowCount = mockScansStore.filter(s => s.riskCategory === 'low').length;
      mediumCount = mockScansStore.filter(s => s.riskCategory === 'medium').length;
      highCount = mockScansStore.filter(s => s.riskCategory === 'high').length;
      const sum = mockScansStore.reduce((acc, s) => acc + (s.riskScore || 0), 0);
      avgScore = totalScans > 0 ? Math.round(sum / totalScans) : 0;
    }

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        averageRiskScore: avgScore,
        riskDistribution: {
          low: { count: lowCount, percentage: totalScans ? Math.round((lowCount / totalScans) * 100) : 0 },
          medium: { count: mediumCount, percentage: totalScans ? Math.round((mediumCount / totalScans) * 100) : 0 },
          high: { count: highCount, percentage: totalScans ? Math.round((highCount / totalScans) * 100) : 0 }
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get temporal scan trends and top flagged domains/indicators
 * @route   GET /api/analytics/trends
 * @access  Public
 */
const getTrends = async (req, res, next) => {
  try {
    const isDbReady = getConnectionStatus() && mongoose.connection.readyState === 1;

    // Generate last 7 days template
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    let dailyTrends = days.map(date => ({ date, scans: 0, highRisk: 0 }));
    let topFlaggedDomains = [];
    let topIndicators = [];

    if (isDbReady) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dbDaily = await Scan.aggregate([
        { $match: { scannedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
            total: { $sum: 1 },
            highRisk: {
              $sum: { $cond: [{ $eq: ['$riskCategory', 'high'] }, 1, 0] }
            }
          }
        }
      ]);

      const map = {};
      dbDaily.forEach(d => { map[d._id] = d; });
      dailyTrends = days.map(date => ({
        date,
        scans: map[date]?.total || 0,
        highRisk: map[date]?.highRisk || 0
      }));

      // Top domains
      topFlaggedDomains = await Scan.aggregate([
        { $match: { riskCategory: { $in: ['medium', 'high'] } } },
        { $group: { _id: '$hostname', count: { $sum: 1 }, maxScore: { $max: '$riskScore' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { domain: '$_id', count: 1, maxScore: 1, _id: 0 } }
      ]);

      // Top indicators
      topIndicators = await Scan.aggregate([
        { $unwind: '$indicators' },
        { $group: { _id: '$indicators.name', count: { $sum: 1 }, severity: { $first: '$indicators.severity' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { name: '$_id', count: 1, severity: 1, _id: 0 } }
      ]);
    } else {
      // Mock store computation
      const domainMap = {};
      const indMap = {};
      mockScansStore.forEach(s => {
        if (s.riskCategory !== 'low') {
          domainMap[s.hostname] = (domainMap[s.hostname] || 0) + 1;
        }
        (s.indicators || []).forEach(i => {
          indMap[i.name] = (indMap[i.name] || 0) + 1;
        });
      });

      topFlaggedDomains = Object.entries(domainMap)
        .map(([domain, count]) => ({ domain, count, maxScore: 85 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      topIndicators = Object.entries(indMap)
        .map(([name, count]) => ({ name, count, severity: 'warning' }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    res.status(200).json({
      success: true,
      data: {
        dailyTrends,
        topFlaggedDomains,
        topIndicators
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getTrends
};
