const mongoose = require('mongoose');
const { Schema } = mongoose;

const trackerSchema = new Schema({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  channelName: { // e.g., "Facebook Ad", "In-Store Pamphlet", "WhatsApp", "Instagram"
    type: String,
    required: true
  },
  channelType: { // e.g., "social", "print", "digital", "whatsapp", "instagram"
    type: String,
    required: true
  },
  uniquePath: { // The unique part of the URL, e.g., "c1-a1"
    type: String,
    required: true,
    unique: true
  },
  codePrefix: { // Channel-specific prefix for redeem codes (e.g., "PAMP", "INST", "WHAP")
    type: String,
    required: true,
    maxlength: 4
  },
  visits: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Tracker', trackerSchema);