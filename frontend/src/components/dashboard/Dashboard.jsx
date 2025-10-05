import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Footer from '../layout/Footer';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Try to fetch tasks, but don't fail if it doesn't work
      let tasks = [];
      try {
        console.log('Dashboard: Fetching tasks...');
        const response = await axios.get('/api/tasks');
        console.log('Dashboard: Response received:', response.data);
        
       
        if (response.data.success) {
          // Backend server format
          tasks = response.data.data || [];
          console.log('Dashboard: Using backend format, tasks:', tasks.length);
        } else if (response.data.tasks) {
          // Frontend server format
          tasks = response.data.tasks || [];
          console.log('Dashboard: Using frontend format, tasks:', tasks.length);
        } else {
          tasks = [];
          console.log('Dashboard: No tasks found in response');
        }
        
      } catch (apiError) {
        console.log('Dashboard: API not available, using empty task list');
        tasks = [];
      }

      // Calculate stats
      const stats = {
        total: tasks.length,
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in-progress').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        overdue: tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          return dueDate < today && task.status !== 'completed';
        }).length
      };

      setStats(stats);
      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Error in dashboard:', error);
      // Set default stats even if there's an error
      setStats({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
      });
      setRecentTasks([]);
    } finally {
      setLoading(false);
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
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
          <div className="loading-spinner">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's an overview of your tasks.</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Tasks</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <FiClock />
            </div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon in-progress">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>{stats.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon overdue">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.overdue}</h3>
              <p>Overdue</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/tasks/create" className="action-card">
              <FiPlus className="action-icon" />
              <h3>Create New Task</h3>
              <p>Add a new task to your list</p>
            </Link>

            <Link to="/tasks" className="action-card">
              <FiClock className="action-icon" />
              <h3>View All Tasks</h3>
              <p>See all your tasks and manage them</p>
            </Link>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="recent-tasks">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <Link to="/tasks" className="view-all-link">
              View All
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <FiClock className="empty-icon" />
              <h3>No tasks yet</h3>
              <p>Create your first task to get started</p>
              <Link to="/tasks/create" className="btn-primary">
                Create Task
              </Link>
            </div>
          ) : (
            <div className="tasks-grid">
              {recentTasks.map((task) => (
                <div key={task._id} className="task-card">
                  <div className="task-header">
                    <h3 className="task-title">{task.title}</h3>
                    <div className="task-badges">
                      <span className={`status-badge ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  
                  <p className="task-description">{task.description}</p>
                  
                  <div className="task-footer">
                    <div className="task-meta">
                      <span className="task-due-date">
                        Due: {formatDate(task.dueDate)}
                      </span>
                      {task.assignedTo && (
                        <span className="task-assignee">
                          Assigned to: {task.assignedTo.name || 'Unknown'}
                        </span>
                      )}
                    </div>
                    
                    <Link 
                      to={`/tasks/${task._id}`} 
                      className="task-link"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
