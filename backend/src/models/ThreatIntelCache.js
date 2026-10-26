const mongoose = require('mongoose');

const threatIntelCacheSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ['google_safe_browsing', 'mock_intel']
    },
    indicatorHash: {
      type: String,
      required: true,
      index: true
    },
    result: {
      isThreat: { type: Boolean, required: true },
      threatTypes: [{ type: String }],
      platformType: { type: String, default: 'ANY_PLATFORM' },
      details: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    checkedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge expired threat intelligence records
// This complies with threat intelligence data retention policies
threatIntelCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
threatIntelCacheSchema.index({ provider: 1, indicatorHash: 1 }, { unique: true });

module.exports = mongoose.model('ThreatIntelCache', threatIntelCacheSchema);
