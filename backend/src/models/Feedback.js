const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: [true, 'Associated Scan ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    feedbackType: {
      type: String,
      enum: ['false_positive', 'false_negative', 'incorrect_indicator'],
      required: [true, 'Feedback type is required']
    },
    description: {
      type: String,
      required: [true, 'Please provide an explanation for your report'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
      index: true
    },
    adminNotes: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({ reviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
