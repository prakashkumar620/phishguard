const crypto = require('crypto');
const axios = require('axios');
const ThreatIntelCache = require('../models/ThreatIntelCache');
const env = require('../config/env');
const { getConnectionStatus } = require('../config/db');

// In-memory cache for standalone mode
const memoryIntelCache = new Map();

/**
 * Generate SHA-256 hash for indicator privacy and cache lookup
 * @param {string} url 
 * @returns {string} sha256 hex digest
 */
const hashIndicator = (url) => {
  return crypto.createHash('sha256').update(url.trim()).digest('hex');
};

/**
 * Check URL against Google Safe Browsing v4 Threat Intelligence API
 * Handles caching, rate-limits, missing API keys, and timeouts safely.
 * @param {string} normalizedUrl 
 * @returns {Promise<{ isConfigured: boolean, status: string, isThreat: boolean, threatTypes?: string[], fromCache?: boolean, provider: string }>}
 */
const checkThreatIntelligence = async (normalizedUrl) => {
  const provider = 'google_safe_browsing';
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY || env.GOOGLE_SAFE_BROWSING_API_KEY;

  // 1. If no API key configured, operate safely in heuristic/ML mode
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      isConfigured: false,
      status: 'service_disabled',
      isThreat: false,
      threatTypes: [],
      provider,
      message: 'External threat intelligence is disabled (No API key configured).'
    };
  }

  const indicatorHash = hashIndicator(normalizedUrl);
  const now = new Date();
  const isDbReady = getConnectionStatus();

  // 2. Check Cache
  try {
    if (isDbReady) {
      const cached = await ThreatIntelCache.findOne({
        provider,
        indicatorHash,
        expiresAt: { $gt: now }
      });

      if (cached) {
        return {
          isConfigured: true,
          status: cached.result.isThreat ? 'flagged_malicious' : 'clean',
          isThreat: cached.result.isThreat,
          threatTypes: cached.result.threatTypes || [],
          fromCache: true,
          provider
        };
      }
    } else {
      const memCached = memoryIntelCache.get(indicatorHash);
      if (memCached && memCached.expiresAt > now) {
        return {
          isConfigured: true,
          status: memCached.result.isThreat ? 'flagged_malicious' : 'clean',
          isThreat: memCached.result.isThreat,
          threatTypes: memCached.result.threatTypes || [],
          fromCache: true,
          provider
        };
      }
    }
  } catch (cacheReadErr) {
    console.warn(`[ThreatIntel] Cache lookup warning: ${cacheReadErr.message}`);
  }

  // 3. Cache Miss: Dispatch to Google Safe Browsing API v4
  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
  const payload = {
    client: {
      clientId: 'phishguard-security-detector',
      clientVersion: '1.0.0'
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION'
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: normalizedUrl }]
    }
  };

  try {
    const response = await axios.post(endpoint, payload, {
      timeout: 2500, // Strict 2.5s timeout to prevent blocking user scans
      headers: { 'Content-Type': 'application/json' }
    });

    const matches = response.data?.matches || [];
    const isThreat = matches.length > 0;
    const threatTypes = matches.map(m => m.threatType);

    // Retention duration: 30 minutes in compliance with Google Safe Browsing Terms
    const ttlMinutes = 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const resultData = {
      isThreat,
      threatTypes,
      platformType: 'ANY_PLATFORM',
      details: matches
    };

    // Save to Cache
    try {
      if (isDbReady) {
        await ThreatIntelCache.findOneAndUpdate(
          { provider, indicatorHash },
          { provider, indicatorHash, result: resultData, checkedAt: now, expiresAt },
          { upsert: true, new: true }
        );
      } else {
        memoryIntelCache.set(indicatorHash, { result: resultData, expiresAt });
      }
    } catch (cacheWriteErr) {
      console.warn(`[ThreatIntel] Cache save warning: ${cacheWriteErr.message}`);
    }

    return {
      isConfigured: true,
      status: isThreat ? 'flagged_malicious' : 'clean',
      isThreat,
      threatTypes,
      fromCache: false,
      provider
    };
  } catch (apiErr) {
    const statusMsg = apiErr.response?.status === 429
      ? 'rate_limited'
      : apiErr.code === 'ECONNABORTED'
      ? 'timeout'
      : 'service_unreachable';

    console.warn(`[ThreatIntel] External API fallback (${statusMsg}): ${apiErr.message}`);

    return {
      isConfigured: true,
      status: statusMsg,
      isThreat: false,
      threatTypes: [],
      provider,
      error: apiErr.message
    };
  }
};

module.exports = {
  checkThreatIntelligence,
  hashIndicator,
  memoryIntelCache
};
