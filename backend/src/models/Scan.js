const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true
    },
    weight: { type: Number, required: true },
    description: { type: String, required: true }
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    submittedUrl: {
      type: String,
      required: [true, 'Submitted URL is required'],
      trim: true,
      maxlength: 2048
    },
    normalizedUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    riskCategory: {
      type: String,
      enum: ['low', 'medium', 'high', 'unknown'],
      required: true,
      index: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    indicators: [indicatorSchema],
    detectionMethods: {
      type: [String],
      enum: ['rule-based', 'machine-learning', 'threat-intelligence'],
      default: ['rule-based']
    },
    modelPrediction: {
      type: String,
      enum: ['legitimate', 'phishing', 'unavailable', null],
      default: null
    },
    modelConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    threatIntelStatus: {
      type: String,
      default: 'unmatched'
    },
    threatIntelDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    explanation: {
      type: String,
      default: ''
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast history queries and analytics
scanSchema.index({ userId: 1, scannedAt: -1 });
scanSchema.index({ riskCategory: 1, scannedAt: -1 });
scanSchema.index({ hostname: 1, scannedAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
