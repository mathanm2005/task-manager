import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';

const router = express.Router();

// Get all tasks (no auth)
router.get('/', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks (kept for compatibility)
router.get('/all', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task (no auth)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task (no auth)
router.post('/', [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, priority, tags, assignedTo, createdBy } = req.body;

    const task = new Task({
      title,
      description,
      createdBy: createdBy || null,
      dueDate,
      priority,
      assignedTo: assignedTo || '',
      tags: tags || []
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task (no auth)
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, status, priority, dueDate, tags } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (dueDate) updates.dueDate = dueDate;
    if (tags) updates.tags = tags;

    if (status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date();
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task (no auth)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to task (no auth)
router.post('/:id/comments', [
  body('text').trim().isLength({ min: 1 }).withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      user: null,
      text: req.body.text
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json({
      message: 'Comment added successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
