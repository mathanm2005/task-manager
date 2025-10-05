import User from '../models/User.js';

export const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact an administrator.' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
