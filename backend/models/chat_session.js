const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  extractedProfile: {
    type: Object, // Stores partial profile details extracted so far
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
