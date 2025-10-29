const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
    trim: true,   // Removes whitespace
    lowercase: true
  },
  password: { // We will store the *hashed* password here
    type: String,
    required: true
  },
  shop_name: {
    type: String,
    required: true
  },
  shop_address: {
    type: String,
    required: true
  },
  shop_phone: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// The first argument 'User' is the singular name of the collection.
// Mongoose will automatically look for the *plural*, *lowercase* version: 'users'
module.exports = mongoose.model('User', userSchema);