const mongoose = require('mongoose');
const { Schema } = mongoose;

const analyticsSchema = new Schema({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  tracker: {
    type: Schema.Types.ObjectId,
    ref: 'Tracker',
    required: true
  },
  eventType: {
    type: String,
    enum: ['visit', 'conversion'],
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelType: {
    type: String,
    required: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    codeGenerated: String, // For visit events
    codeRedeemed: String   // For conversion events
  }
}, { timestamps: true });

// Index for efficient querying
analyticsSchema.index({ campaign: 1, eventType: 1, createdAt: -1 });
analyticsSchema.index({ tracker: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);