const mongoose = require('mongoose');
const { Schema } = mongoose;

const discountCodeSchema = new Schema({
  tracker: { // Which tracker generated this code?
    type: Schema.Types.ObjectId,
    ref: 'Tracker',
    required: true
  },
  codeString: { // The actual code, e.g., "PAMP123", "INST456"
    type: String,
    required: true,
    unique: true
  },
  channelName: { // Store channel name for analytics
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['generated', 'redeemed'], // Only allows these two values
    default: 'generated' // New codes always start as 'generated'
  },
  redeemedAt: {
    type: Date
  },
  customerInfo: {
    ipAddress: String,
    userAgent: String
  }
}, { timestamps: true });

module.exports = mongoose.model('DiscountCode', discountCodeSchema);