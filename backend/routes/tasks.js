import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect, authorize, ownerOrAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();


router.get('/', protect, [
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('assignedTo').optional().isMongoId(),
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

  let filter = {};
  
  // If user is not admin, only show tasks created by them
  if (req.user.role !== 'admin') {
    filter = {
      createdBy: req.user._id
    };
  }

  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Add priority filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Add assignedTo filter (admin only)
  if (req.query.assignedTo && req.user.role === 'admin') {
    filter.assignedTo = req.query.assignedTo;
  }

  // Add search filter
  if (req.query.search) {
    const searchFilter = {
      $or: [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    };
    
    // Combine with existing filter
    if (Object.keys(filter).length > 0) {
      filter = {
        $and: [filter, searchFilter]
      };
    } else {
      filter = searchFilter;
    }
  }

  // Exclude archived tasks unless specifically requested
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

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.user', 'name email');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to this task
  if (req.user.role !== 'admin' && 
      task.assignedTo._id.toString() !== req.user._id.toString() && 
      task.createdBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: task
  });
}));

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('subtasks')
    .optional()
    .isArray()
    .withMessage('Subtasks must be an array'),
  body('subtasks.*.title')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each subtask must have a title (1-100 chars)'),
  body('subtasks.*.completed')
    .optional()
    .isBoolean()
    .withMessage('Subtask completed must be a boolean')
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

  const { title, description, dueDate, assignedTo, priority, tags, subtasks } = req.body;

  // Check if assigned user exists (only if assignedTo is provided)
  if (assignedTo) {
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user not found'
      });
    }
  }

  // Check if due date is in the past
  if (new Date(dueDate) < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Due date cannot be in the past'
    });
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    assignedTo: assignedTo || undefined,
    createdBy: req.user._id,
    priority: priority || 'medium',
    tags: tags || [],
    subtasks: Array.isArray(subtasks)
      ? subtasks.map(st => ({
          title: st.title,
          completed: !!st.completed,
          completedAt: st.completed ? new Date() : undefined
        }))
      : []
  });

  // Populate the created task
  await task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task
  });
}));

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in-progress, completed, or cancelled'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('subtasks')
    .optional()
    .isArray()
    .withMessage('Subtasks must be an array'),
  body('subtasks.*.title')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each subtask must have a title (1-100 chars)'),
  body('subtasks.*.completed')
    .optional()
    .isBoolean()
    .withMessage('Subtask completed must be a boolean')
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

  let task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has permission to update this task
  if (req.user.role !== 'admin' && 
      task.assignedTo?.toString() !== req.user._id.toString() && 
      task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if assigned user exists (if being updated)
  if (req.body.assignedTo) {
    const assignedUser = await User.findById(req.body.assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user not found'
      });
    }
  }

  // Check if due date is in the past (if being updated)
  if (req.body.dueDate && new Date(req.body.dueDate) < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Due date cannot be in the past'
    });
  }

  // Normalize subtasks payload if provided
  if (Array.isArray(req.body.subtasks)) {
    req.body.subtasks = req.body.subtasks.map(st => ({
      title: st.title,
      completed: !!st.completed,
      completedAt: st.completed ? new Date() : undefined
    }));
  }

  // Update task
  task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: task
  });
}));

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has permission to delete this task
  if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only task creator or admin can delete tasks.'
    });
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
router.post('/:id/comments', protect, [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
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

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to this task
  if (req.user.role !== 'admin' && 
      task.assignedTo.toString() !== req.user._id.toString() && 
      task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await task.addComment(req.user._id, req.body.text);

  // Populate and return updated task
  await task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
    { path: 'comments.user', select: 'name email' }
  ]);

  res.json({
    success: true,
    message: 'Comment added successfully',
    data: task
  });
}));

// @desc    Archive/Unarchive task
// @route   PUT /api/tasks/:id/archive
// @access  Private
router.put('/:id/archive', protect, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has permission to archive this task
  if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only task creator or admin can archive tasks.'
    });
  }

  task.isArchived = !task.isArchived;
  await task.save();

  res.json({
    success: true,
    message: `Task ${task.isArchived ? 'archived' : 'unarchived'} successfully`,
    data: task
  });
}));

export default router;
