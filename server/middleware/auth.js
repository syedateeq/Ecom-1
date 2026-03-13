const jwt = require('jsonwebtoken');

// Middleware to verify JWT token for both Users and Retailers
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { id, role } — role is 'user' or 'retailer'
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if the user is a retailer
const retailerOnly = (req, res, next) => {
  if (req.user.role !== 'retailer') {
    return res.status(403).json({ message: 'Access denied. Retailers only.' });
  }
  next();
};

module.exports = { auth, retailerOnly };
