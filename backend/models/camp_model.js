const mongoose = require('mongoose');
const { Schema } = mongoose;

const campaignSchema = new Schema({
  // This creates the relationship
  user: {
    type: Schema.Types.ObjectId, // A special type for storing MongoDB IDs
    ref: 'User', // Tells Mongoose this ID refers to a document in the 'User' collection
    required: true
  },
  theme: {
    type: String,
    required: true
  },
  offer: {
    type: String,
    required: true
  },
  campaignType: {
    type: String,
    enum: ['online', 'offline', 'hybrid', 'Online Only', 'Offline Only', 'Both'], // Support both frontend and backend formats
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  targetAudience: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);