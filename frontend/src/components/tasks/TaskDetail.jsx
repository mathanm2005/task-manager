import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiEye, FiPlus, FiSearch, FiFilter, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TaskDetail = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTasks();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [currentPage, filters, user, authLoading, navigate]);

  const fetchTasks = async () => {
    try {
      // Build params object, excluding empty filter values
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      // Only add filters if they have values
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/tasks?${params}`);
      
      // Handle both response formats (backend and frontend server)
      if (response.data.success) {
        // Backend server format
        setTasks(response.data.data || []);
        setTotalPages(response.data.pages || 1);
      } else if (response.data.tasks) {
        // Frontend server format
        setTasks(response.data.tasks || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setTasks([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login to view tasks');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to load tasks. Please check your connection.');
      }
      
      setTasks([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/tasks/${taskId}`);
      
      // Handle both response formats (backend and frontend server)
      if (response.data.success || response.data.message === 'Task deleted successfully') {
        toast.success('Task deleted successfully');
        fetchTasks();
      } else {
        toast.error(response.data.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      
      if (error.response?.status === 404) {
        toast.error('Task not found');
        fetchTasks();
      } else if (error.response?.status === 401) {
        toast.error('Please login to delete tasks');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to delete this task');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to delete task. Please check your connection.');
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({
      title: '',
      description: '',
      status: '',
      priority: '',
      dueDate: ''
    });
  };

  const handleSaveEdit = async (taskId) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, editForm);
      
      // Handle both response formats (backend and frontend server)
      if (response.data.success || response.data.message === 'Task updated successfully') {
        toast.success('Task updated successfully');
        setEditingTask(null);
        fetchTasks();
      } else {
        toast.error(response.data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      
      if (error.response?.status === 404) {
        toast.error('Task not found');
      } else if (error.response?.status === 401) {
        toast.error('Please login to update tasks');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to update this task');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to update task. Please check your connection.');
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingStatus(taskId);
    
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      
      // Handle both response formats (backend and frontend server)
      if (response.data.success || response.data.message === 'Task updated successfully') {
        toast.success('Task status updated successfully');
        fetchTasks();
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      
      if (error.response?.status === 404) {
        toast.error('Task not found');
      } else if (error.response?.status === 401) {
        toast.error('Please login to update tasks');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to update this task');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to update status. Please check your connection.');
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="task-list-container">
        <div className="loading-spinner">
          {authLoading ? 'Checking authentication...' : 'Loading tasks...'}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="task-list-container">
        <div className="empty-state">
          <h3>Please login to view tasks</h3>
          <Link to="/login" className="btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      <div className="page-header">
        <Link to="/dashboard" className="back-button">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>
      
      <div className="task-list-header">
        <div className="header-content">
          <h1>All Tasks</h1>
          <p>View and manage all your created tasks</p>
        </div>
        <Link to="/tasks/create" className="create-task-btn">
          <FiPlus />
          <span>Create Task</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <FiFilter className="empty-icon" />
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create a new task</p>
          <Link to="/tasks/create" className="btn-primary">
            Create Task
          </Link>
        </div>
      ) : (
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className={`task-row ${editingTask === task._id ? 'editing' : ''}`}>
                  <td className="task-title-cell">
                    {editingTask === task._id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="form-input"
                          placeholder="Task title"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="form-input"
                          placeholder="Task description"
                          rows="2"
                        />
                      </div>
                    ) : (
                      <div className="task-title-content">
                        <h4 className="task-title">{task.title}</h4>
                        <p className="task-description">{task.description}</p>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingTask === task._id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        className="form-input"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className={`status-select ${getStatusColor(task.status)} ${updatingStatus === task._id ? 'updating' : ''}`}
                        disabled={updatingStatus === task._id}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {editingTask === task._id ? (
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="form-input"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : (
                      <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                  </td>
                  <td className="date-cell">
                    {editingTask === task._id ? (
                      <input
                        type="date"
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="form-input"
                      />
                    ) : (
                      formatDate(task.dueDate)
                    )}
                  </td>
                  <td className="assigned-cell">
                    {task.assignedTo ? (task.assignedTo.name || 'Unknown') : 'Unassigned'}
                  </td>
                  <td className="date-cell">
                    {formatDate(task.createdAt)}
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions">
                      {editingTask === task._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(task._id)}
                            className="action-btn save"
                            title="Save Changes"
                          >
                            <FiSave />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="action-btn cancel"
                            title="Cancel Edit"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => navigate(`/tasks/${task._id}`)}
                            className="action-btn view"
                            title="View Details"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleEditTask(task)}
                            className="action-btn edit"
                            title="Edit Task"
                          >
                            <FiEdit3 />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="action-btn delete"
                            title="Delete Task"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
