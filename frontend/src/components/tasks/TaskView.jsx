import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiMessageSquare, FiCalendar, FiUser, FiTag, FiCheckSquare, FiSquare } from 'react-icons/fi';
import axios from 'axios';

const TaskView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`/api/tasks/${id}`);
      
      // Handle both response formats (backend and frontend server)
      if (response.data.success) {
        setTask(response.data.data);
      } else if (response.data.task) {
        setTask(response.data.task);
      } else {
        toast.error('Task not found');
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      
      if (error.response?.status === 404) {
        toast.error('Task not found');
        navigate('/tasks');
      } else if (error.response?.status === 401) {
        toast.error('Please login to view task details');
        navigate('/login');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to load task details. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/api/tasks/${id}`, { status: newStatus });
      toast.success('Task status updated successfully');
      fetchTask();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`/api/tasks/${id}/comments`, { text: comment });
      setComment('');
      toast.success('Comment added successfully');
      fetchTask();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSubtask = async (subtaskIndex) => {
    try {
      const updatedSubtasks = task.subtasks.map((st, idx) => 
        idx === subtaskIndex ? { ...st, completed: !st.completed } : st
      );
      
      const response = await axios.put(`/api/tasks/${id}`, { subtasks: updatedSubtasks });
      
      if (response.data.success) {
        setTask(response.data.data);
        toast.success('Subtask updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update subtask');
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await axios.delete(`/api/tasks/${id}`);
      
      if (response.data.success) {
        toast.success('Task deleted successfully');
        navigate('/tasks');
      } else {
        toast.error(response.data.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      
      if (error.response?.status === 404) {
        toast.error('Task not found');
        navigate('/tasks');
      } else if (error.response?.status === 401) {
        toast.error('Please login to delete tasks');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to delete this task');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to delete task. Please check your connection.');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading task details...</div>;
  }

  if (!task) {
    return <div className="empty-state">Task not found</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      default: return 'priority-default';
    }
  };

  return (
    <div className="task-detail-container">
      <div className="page-header">
        <Link to="/dashboard" className="back-button">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>
      
      <div className="task-detail-header">
        <button 
          onClick={() => navigate('/tasks')}
          className="back-button"
        >
          <FiArrowLeft /> Back to Tasks
        </button>
        <div className="task-actions">
          <button 
            onClick={handleDelete}
            className="delete-button"
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div className="task-detail-content">
        <div className="task-main-info">
          <h1 className="task-title">{task.title}</h1>
          <div className="task-badges">
            <span className={`status-badge ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <p className="task-description">{task.description}</p>
        </div>

        <div className="task-meta-grid">
          <div className="meta-item">
            <FiUser className="meta-icon" />
            <div>
              <span className="meta-label">Assigned to</span>
              <span className="meta-value">{task.assignedTo ? (task.assignedTo.name || 'Unknown') : 'Unassigned'}</span>
            </div>
          </div>
          <div className="meta-item">
            <FiCalendar className="meta-icon" />
            <div>
              <span className="meta-label">Due Date</span>
              <span className="meta-value">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="meta-item">
            <FiUser className="meta-icon" />
            <div>
              <span className="meta-label">Created by</span>
              <span className="meta-value">{task.createdBy?.name || 'N/A'}</span>
            </div>
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="meta-item">
              <FiTag className="meta-icon" />
              <div>
                <span className="meta-label">Tags</span>
                <div className="tags-container">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="task-subtasks-section">
            <h3>Subtasks</h3>
            <div className="subtasks-list">
              {task.subtasks.map((subtask, index) => (
                <div key={index} className="subtask-item">
                  <button
                    onClick={() => handleToggleSubtask(index)}
                    className="subtask-checkbox"
                    title={subtask.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {subtask.completed ? (
                      <FiCheckSquare className="checked" />
                    ) : (
                      <FiSquare />
                    )}
                  </button>
                  <span className={`subtask-title ${subtask.completed ? 'completed' : ''}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="task-status-section">
          <h3>Update Status</h3>
          <div className="status-buttons">
            {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`status-button ${task.status === status ? 'active' : ''}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="task-comments-section">
          <h3>Comments</h3>
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
              rows="3"
            />
            <button 
              type="submit" 
              disabled={submitting || !comment.trim()}
              className="comment-submit"
            >
              {submitting ? 'Adding...' : 'Add Comment'}
            </button>
          </form>

          <div className="comments-list">
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user?.name}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="no-comments">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskView;
