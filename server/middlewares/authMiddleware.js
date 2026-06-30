const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Authorization header looks like: "Bearer eyJhbGc..."
    // Check it exists AND starts with the word "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      
      // split('Bearer eyJhbGc...') turns it into ['Bearer', 'eyJhbGc...']
      // [1] grabs just the second piece — the actual token itself
      token = req.headers.authorization.split(' ')[1];
    }

    // If there was no token at all, block the request
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify the token is real and not expired/tampered
    // decoded will contain whatever was embedded at login: { id: ... }
    let decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up the actual user using that id, attach it to req
    // so every controller after this can use req.user
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Everything checked out — let the request continue
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };