// Example: middleware/auth.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // If you're using this
const User = require('../models/User'); // Adjust path as needed

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // <-- Ensure JWT_SECRET is accessed here

      // Find user by ID and attach to request
      req.user = await User.findById(decoded.id).select('-password')
      .populate('idRecinto')
      .populate('idMesa');

      // If user is not found, throw error
      if (!req.user) {
        res.status(401); // Unauthorized
        throw new Error('Not authorized, user not found'); // This is the error you're seeing
      }

      next();
    } catch (error) {
      console.error(error); // Keep this for debugging during development
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };