import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate days left for a task
  const calculateDaysLeft = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fetch notifications from tasks
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await axios.get('/api/tasks');
      if (response.data.success) {
        const tasks = response.data.data || [];
        const taskNotifications = [];

        tasks.forEach(task => {
          if (task.status !== 'completed' && task.status !== 'cancelled') {
            const daysLeft = calculateDaysLeft(task.dueDate);
            
            // Create notifications based on days left
            if (daysLeft < 0) {
              taskNotifications.push({
                id: `overdue-${task._id}`,
                taskId: task._id,
                type: 'overdue',
                title: 'Task Overdue!',
                message: `"${task.title}" is overdue by ${Math.abs(daysLeft)} day(s)`,
                daysLeft: daysLeft,
                priority: 'urgent',
                createdAt: task.createdAt,
                read: false
              });
            } else if (daysLeft === 0) {
              taskNotifications.push({
                id: `due-today-${task._id}`,
                taskId: task._id,
                type: 'due-today',
                title: 'Task Due Today!',
                message: `"${task.title}" is due today`,
                daysLeft: daysLeft,
                priority: 'high',
                createdAt: task.createdAt,
                read: false
              });
            } else if (daysLeft === 1) {
              taskNotifications.push({
                id: `due-tomorrow-${task._id}`,
                taskId: task._id,
                type: 'due-tomorrow',
                title: 'Task Due Tomorrow',
                message: `"${task.title}" is due tomorrow`,
                daysLeft: daysLeft,
                priority: 'high',
                createdAt: task.createdAt,
                read: false
              });
            } else if (daysLeft <= 3) {
              taskNotifications.push({
                id: `due-soon-${task._id}`,
                taskId: task._id,
                type: 'due-soon',
                title: 'Task Due Soon',
                message: `"${task.title}" is due in ${daysLeft} days`,
                daysLeft: daysLeft,
                priority: 'medium',
                createdAt: task.createdAt,
                read: false
              });
            } else if (daysLeft <= 7) {
              taskNotifications.push({
                id: `upcoming-${task._id}`,
                taskId: task._id,
                type: 'upcoming',
                title: 'Upcoming Task',
                message: `"${task.title}" is due in ${daysLeft} days`,
                daysLeft: daysLeft,
                priority: 'low',
                createdAt: task.createdAt,
                read: false
              });
            }
          }
        });

        // Sort by priority and days left
        taskNotifications.sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.daysLeft - b.daysLeft;
        });

        setNotifications(taskNotifications);
        setUnreadCount(taskNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Add notification for newly created task
  const addTaskCreatedNotification = (task) => {
    const daysLeft = calculateDaysLeft(task.dueDate);
    const newNotification = {
      id: `created-${task._id}-${Date.now()}`,
      taskId: task._id,
      type: 'task-created',
      title: 'Task Created Successfully!',
      message: `"${task.title}" has been created. Due in ${daysLeft} day(s)`,
      daysLeft: daysLeft,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    addTaskCreatedNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
