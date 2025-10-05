import express from 'express';
import { body, validationResult, query } from 'express-validator';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(protect, adminOnly);

router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'admin']),
  query('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  if (req.query.role) {
    filter.role = req.query.role;
  }
  
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Add search filter
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: users
  });
}));

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's task statistics
  const taskStats = await Task.aggregate([
    { $match: { assignedTo: user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  };

  taskStats.forEach(stat => {
    stats.total += stat.count;
    stats[stat._id] = stat.count;
  });

  res.json({
    success: true,
    data: {
      user,
      taskStats: stats
    }
  });
}));

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deactivating themselves
  if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
    return res.status(400).json({
      success: false,
      message: 'You cannot deactivate your own account'
    });
  }

  // Check if email is already taken by another user
  if (req.body.email) {
    const existingUser = await User.findOne({ 
      email: req.body.email, 
      _id: { $ne: req.params.id } 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  });
}));

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deleting themselves
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  // Check if user has tasks
  const userTasks = await Task.countDocuments({
    $or: [
      { assignedTo: user._id },
      { createdBy: user._id }
    ]
  });

  if (userTasks > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user with existing tasks. Please reassign or delete tasks first.'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get user statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get task statistics
  const taskStats = await Task.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get priority statistics
  const priorityStats = await Task.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get recent tasks
  const recentTasks = await Task.find()
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get overdue tasks
  const overdueTasks = await Task.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 })
    .limit(10);

  // Format statistics
  const stats = {
    users: {
      total: 0,
      admins: 0,
      regular: 0
    },
    tasks: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0
    },
    priorities: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    }
  };

  userStats.forEach(stat => {
    stats.users.total += stat.count;
    if (stat._id === 'admin') {
      stats.users.admins = stat.count;
    } else {
      stats.users.regular = stat.count;
    }
  });

  taskStats.forEach(stat => {
    stats.tasks.total += stat.count;
    stats.tasks[stat._id] = stat.count;
  });

  priorityStats.forEach(stat => {
    stats.priorities[stat._id] = stat.count;
  });

  res.json({
    success: true,
    data: {
      stats,
      recentTasks,
      overdueTasks
    }
  });
}));

// @desc    Get all tasks (admin view)
// @route   GET /api/admin/tasks
// @access  Private/Admin
router.get('/tasks', [
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('assignedTo').optional().isMongoId(),
  query('createdBy').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  if (req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  }

  if (req.query.createdBy) {
    filter.createdBy = req.query.createdBy;
  }

  // Add search filter
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Include archived tasks if requested
  if (!req.query.includeArchived) {
    filter.isArchived = false;
  }

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Task.countDocuments(filter);

  res.json({
    success: true,
    count: tasks.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: tasks
  });
}));

export default router;
