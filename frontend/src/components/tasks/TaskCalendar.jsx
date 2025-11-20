import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TaskCalendar = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!authLoading && user) {
      fetchMonthlyTaskData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [currentYear, user, authLoading, navigate]);

  const fetchMonthlyTaskData = async () => {
    try {
      setLoading(true);
      let allTasks = [];
      let page = 1;
      let hasMorePages = true;

      // Fetch all tasks with pagination (max limit is 100 per page)
      while (hasMorePages) {
        try {
          const response = await axios.get(`/api/tasks?limit=100&page=${page}`);
          
          if (response.data.success) {
            const tasks = response.data.data || [];
            allTasks = [...allTasks, ...tasks];
            
            // Check if there are more pages
            const totalPages = response.data.pages || 1;
            hasMorePages = page < totalPages;
            page++;
          } else {
            hasMorePages = false;
          }
        } catch (pageError) {
          console.error(`Error fetching page ${page}:`, pageError);
          hasMorePages = false;
        }
      }

      console.log('Total tasks fetched:', allTasks.length);

      // Group tasks by month
      const monthCounts = {};
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Initialize all months with 0
      monthNames.forEach((month, index) => {
        monthCounts[month] = { count: 0, tasks: [] };
      });

      // Count tasks by month
      allTasks.forEach(task => {
        const taskDate = new Date(task.createdAt);
        const taskYear = taskDate.getFullYear();
        const monthIndex = taskDate.getMonth();
        const monthName = monthNames[monthIndex];

        if (taskYear === currentYear) {
          monthCounts[monthName].count += 1;
          monthCounts[monthName].tasks.push(task);
        }
      });

      console.log('Monthly data:', monthCounts);
      console.log('Total tasks in year:', Object.values(monthCounts).reduce((sum, m) => sum + m.count, 0));
      setMonthlyData(monthCounts);
    } catch (error) {
      console.error('Error fetching monthly task data:', error);
      toast.error('Failed to load task calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthColor = (count) => {
    if (count === 0) return 'month-empty';
    if (count <= 2) return 'month-low';
    if (count <= 5) return 'month-medium';
    if (count <= 10) return 'month-high';
    return 'month-very-high';
  };

  const getIntensityLabel = (count) => {
    if (count === 0) return 'No tasks';
    if (count === 1) return '1 task';
    return `${count} tasks`;
  };

  if (authLoading || loading) {
    return (
      <div className="task-calendar-container">
        <div className="loading-spinner">
          {authLoading ? 'Checking authentication...' : 'Loading calendar data...'}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="task-calendar-container">
        <div className="empty-state">
          <h3>Please login to view task calendar</h3>
          <Link to="/login" className="btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  // Calculate total tasks for debugging
  const totalTasks = Object.values(monthlyData).reduce((sum, m) => sum + (m?.count || 0), 0);
  console.log('Rendering with total tasks:', totalTasks, 'monthlyData:', monthlyData);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="task-calendar-container">
      <div className="page-header">
        <Link to="/dashboard" className="back-button">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <div className="calendar-header">
        <div className="calendar-title">
          <FiCalendar className="calendar-icon" />
          <h1>Task Calendar</h1>
          <p>Monthly task creation overview</p>
        </div>
        
        <div className="year-selector">
          <button 
            onClick={() => setCurrentYear(currentYear - 1)}
            className="year-nav-btn"
            title="Previous year"
          >
            <FiArrowLeft />
          </button>
          <span className="current-year">{currentYear}</span>
          <button 
            onClick={() => setCurrentYear(currentYear + 1)}
            className="year-nav-btn"
            title="Next year"
          >
            <FiArrowRight />
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color month-empty"></div>
          <span>No tasks</span>
        </div>
        <div className="legend-item">
          <div className="legend-color month-low"></div>
          <span>1-2 tasks</span>
        </div>
        <div className="legend-item">
          <div className="legend-color month-medium"></div>
          <span>3-5 tasks</span>
        </div>
        <div className="legend-item">
          <div className="legend-color month-high"></div>
          <span>6-10 tasks</span>
        </div>
        <div className="legend-item">
          <div className="legend-color month-very-high"></div>
          <span>10+ tasks</span>
        </div>
      </div>

      <div className="months-grid">
        {monthNames.map((month, index) => {
          const data = monthlyData[month] || { count: 0, tasks: [] };
          return (
            <div 
              key={index} 
              className={`month-card ${getMonthColor(data.count)}`}
              title={`${month}: ${getIntensityLabel(data.count)}`}
            >
              <div className="month-name">{month}</div>
              <div className="month-count">{data.count}</div>
              <div className="month-label">{getIntensityLabel(data.count)}</div>
              {data.tasks.length > 0 && (
                <div className="month-tasks-preview">
                  {data.tasks.slice(0, 3).map((task, idx) => (
                    <div key={idx} className="task-preview" title={task.title}>
                      {task.title.substring(0, 20)}...
                    </div>
                  ))}
                  {data.tasks.length > 3 && (
                    <div className="more-tasks">+{data.tasks.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalTasks === 0 && (
        <div className="empty-state" style={{ marginBottom: 'var(--space-8)' }}>
          <p>No tasks created in {currentYear}. Start creating tasks to see them on the calendar!</p>
          <Link to="/tasks/create" className="btn-primary">Create Task</Link>
        </div>
      )}

      <div className="calendar-stats">
        <div className="stat-card">
          <div className="stat-label">Total Tasks in {currentYear}</div>
          <div className="stat-value">
            {(() => {
              const total = Object.values(monthlyData).reduce((sum, m) => sum + (m?.count || 0), 0);
              console.log('Calculating total:', total);
              return total;
            })()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Months with Tasks</div>
          <div className="stat-value">
            {Object.values(monthlyData).filter(m => (m?.count || 0) > 0).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Tasks/Month</div>
          <div className="stat-value">
            {(() => {
              const total = Object.values(monthlyData).reduce((sum, m) => sum + (m?.count || 0), 0);
              return (total / 12).toFixed(1);
            })()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Peak Month</div>
          <div className="stat-value">
            {(() => {
              const peak = Object.entries(monthlyData).reduce((max, [month, data]) => 
                (data?.count || 0) > (max?.count || 0) ? { month, count: data?.count || 0 } : max,
                { month: 'N/A', count: 0 }
              );
              return peak.month;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar;
