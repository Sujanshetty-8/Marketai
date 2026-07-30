const mongoose = require('mongoose');
const { Schema } = mongoose;

const businessProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One business profile per user
  },
  businessName: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  targetAudience: {
    type: String,
    default: ''
  },
  products: {
    type: [String],
    default: []
  },
  services: {
    type: [String],
    default: []
  },
  budget: {
    type: Number,
    default: 0
  },
  businessSize: {
    type: String,
    enum: ['Micro', 'Small', 'Medium', ''],
    default: ''
  },
  usp: {
    type: String,
    default: ''
  },
  channels: {
    type: [String],
    default: []
  },
  goals: {
    type: [String],
    default: []
  },
  competitors: {
    type: [String],
    default: []
  },
  preferredLanguage: {
    type: String,
    default: 'English'
  }
}, { timestamps: true });

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
