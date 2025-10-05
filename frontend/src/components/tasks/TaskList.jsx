import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiSearch, FiFilter, FiEye, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`/api/tasks?${params}`);
      
      if (response.data && response.data.success) {
        // Handle both response formats: data.tasks or just data
        const tasksData = response.data.data || response.data.tasks || [];
        const totalTasks = response.data.total || (Array.isArray(tasksData) ? tasksData.length : 0);
        const pages = response.data.pages || Math.ceil(totalTasks / 10);
        
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setTotalPages(pages || 1);
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
      
      if (response.data.success) {
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

  if (loading) {
    return (
      <div className="task-list-container">
        <div className="loading-spinner">Loading tasks...</div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-list-container">
        <div className="no-tasks">
          <h2>No tasks found</h2>
          <p>Create your first task to get started!</p>
          <Link to="/tasks/create" className="create-task-btn">
            <FiPlus />
            <span>Create Your First Task</span>
          </Link>
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
          <h1>My Tasks</h1>
          <p>Manage and track your assigned tasks</p>
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
                <tr key={task._id} className="task-row">
                  <td className="task-title-cell">
                    <div className="task-title-content">
                      <h4 className="task-title">{task.title}</h4>
                      <p className="task-description">{task.description}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="date-cell">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="assigned-cell">
                    {task.assignedTo ? (task.assignedTo.name || 'Unknown') : 'Unassigned'}
                  </td>
                  <td className="date-cell">
                    {formatDate(task.createdAt)}
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions">
                      <Link 
                        to={`/tasks/${task._id}`} 
                        className="action-btn view"
                        title="View Details"
                      >
                        <FiEye />
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="action-btn delete"
                        title="Delete Task"
                      >
                        <FiTrash2 />
                      </button>
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

export default TaskList;
