const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = new Schema({
  tracker: {
    type: Schema.Types.ObjectId,
    ref: 'Tracker',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now // Sets the time automatically when an event is created
  }
  // You could add more info here later, like IP address, user agent, etc.
});

// We don't need timestamps: true, since we have our own
module.exports = mongoose.model('Event', eventSchema);