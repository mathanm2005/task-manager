import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiSave, FiX, FiUser, FiCalendar, FiTag, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const CreateTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    tags: []
  });
  const [errors, setErrors] = useState({});

  // Check if user is authenticated
  React.useEffect(() => {
    if (!user) {
      toast.error('Please login to create tasks');
      navigate('/login');
      return;
    }
    
    // Test backend connectivity
    const testConnection = async () => {
      try {
        const response = await axios.get('/api/health');
        console.log('Backend health check:', response.data);
      } catch (error) {
        console.error('Backend connection failed:', error);
        toast.error('Cannot connect to server. Please ensure backend is running on port 4000.');
      }
    };
    
    testConnection();
  }, [user, navigate]);

  // Users fetching removed (no admin/users endpoint)

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // assignedTo removed for now

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        tags: formData.tags
      };
      
      console.log('Creating task with payload:', payload);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await axios.post('/api/tasks', payload);
      
      console.log('Task creation response:', response.data);
      
      // Handle both response formats (backend and frontend server)
      if (response.data.success || response.data.message === 'Task created successfully') {
        toast.success('Task created successfully!');
        navigate('/tasks');
      } else {
        console.error('Unexpected response format:', response.data);
        toast.error(response.data.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error('Please login to create tasks');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid task data');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to create task. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tasks');
  };

  return (
    <div className="create-task-container">
      <div className="page-header">
        <Link to="/dashboard" className="back-button">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>
      
      <div className="create-task-header">
        <h1>Create New Task</h1>
        <p>Add a new task to your project</p>
      </div>

      <form onSubmit={handleSubmit} className="create-task-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              className={`form-input ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>


          <div className="form-group">
            <label htmlFor="dueDate">Due Date *</label>
            <div className="date-wrapper">
              <FiCalendar className="date-icon" />
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`form-input ${errors.dueDate ? 'error' : ''}`}
              />
            </div>
            {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter detailed description of the task..."
            rows="6"
            className={`form-input ${errors.description ? 'error' : ''}`}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <div className="tags-input">
            <FiTag className="tag-icon" />
            <input
              type="text"
              placeholder="Press Enter to add tags..."
              onKeyPress={handleTagInput}
              className="form-input"
            />
          </div>
          {formData.tags.length > 0 && (
            <div className="tags-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="remove-tag"
                  >
                    <FiX />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating...
              </>
            ) : (
              <>
                <FiSave />
                Create Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;
