import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Admin middleware - check if user is admin
const requireAdmin = [auth, adminAuth];

// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const query = User.find({}).select('-password').sort({ createdAt: -1 });
    
    if (limit > 0) {
      query.limit(limit);
    }
    
    const users = await query;
    res.json({ 
      success: true,
      data: users 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', requireAdmin, [
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user active status (admin only)
router.put('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete all tasks associated with this user
    await Task.deleteMany({ 
      $or: [
        { createdBy: user._id },
        { assignedTo: user._id }
      ]
    });

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and associated tasks deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system statistics (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admin: adminUsers
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activity (admin only)
router.get('/activity', requireAdmin, async (req, res) => {
  try {
    const recentUsers = await User.find({})
      .select('-password')
      .sort({ lastLogin: -1 })
      .limit(10);

    const recentTasks = await Task.find({})
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      recentUsers,
      recentTasks
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
