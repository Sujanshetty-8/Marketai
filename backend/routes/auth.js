
// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model.js');

router.post('/register', async (req, res) => {
  // --- ADD LOGGING ---
  console.log('Received registration request:');
  console.log('Request Body:', req.body);
  // --- END LOGGING ---

  try {
    const { email, password, shop_name, shop_address, shop_phone } = req.body; // Check if frontend sends these exact names

    // Add checks for required fields if needed
    if (!email || !password || !shop_name || !shop_address || !shop_phone) {
      console.error('Validation Error: Missing required fields');
      return res.status(400).json({ msg: 'Please provide all required fields', message: 'Please provide all required fields' });
    }


    let user = await User.findOne({ email });
    if (user) {
      console.log(`Registration attempt failed: User already exists (${email})`); // Add log
      return res.status(400).json({ msg: 'User already exists', message: 'User already exists' });
    }

    user = new User({
      email,
      shop_name,
      shop_address,
      shop_phone
      // Password is set after hashing
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log(`Password hashed for user: ${email}`); // Add log

    // --- ADD LOGGING ---
    console.log('Attempting to save user to database...');
    // --- END LOGGING ---

    await user.save(); // This is the database save operation

    // --- ADD LOGGING ---
    console.log(`User registered successfully: ${email}`);
    // --- END LOGGING ---

    res.status(201).json({ msg: 'User registered successfully', message: 'User registered successfully' }); // Added 'message' for consistency

  } catch (error) {
    // --- IMPORTANT: Log the actual error ---
    console.error('!!! Error during registration process:');
    console.error(error); // Log the full error object
    // --- END IMPORTANT ---
    res.status(500).json({ message: 'Server Error during registration' }); // Send JSON error
  }
});

router.post('/login', async (req, res) => {
  try {
    // 1. Get email and password from request
    const { email, password } = req.body;

    // 2. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't say "user not found" for security
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 3. Check if password is correct
    // We compare the plain text password (from req.body)
    // with the hashed password (from the database)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 4. User is valid! Create the "digital pass" (token)
    // We'll put the user's database ID in the token
    const payload = {
      user: {
        id: user.id // user.id is the MongoDB _id
      }
    };

    // 5. Sign the token with your secret key
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Fetches your secret from .env
      { expiresIn: '30d' },    // Token is good for 30 days
      (err, token) => {
        if (err) throw err;
        // 6. Send the token back to the user
        res.json({
          token,
          shopName: user.shop_name, // Add shopName
          shopId: user.id          // It might be useful to send shopId too
        });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;