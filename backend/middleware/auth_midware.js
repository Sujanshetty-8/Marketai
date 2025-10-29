// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // To get the JWT_SECRET

module.exports = function(req, res, next) {
  // 1. Get the token from the request header
  // Support both Authorization Bearer and x-auth-token formats
  let token = req.header('x-auth-token');
  
  // If no x-auth-token, check for Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  // 2. Check if no token was sent
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verify the token is valid
  try {
    // jwt.verify() checks the token against the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. If valid, add the user's ID to the request object
    // The 'decoded' object contains the 'payload' we created during login
    req.user = decoded.user; // req.user now contains { id: '...' }

    // 5. Tell Express to proceed to the *next* function (the actual route)
    next(); 
    
  } catch (err) {
    // If the token is invalid (e.g., expired or wrong secret)
    res.status(401).json({ msg: 'Token is not valid' });
  }
};