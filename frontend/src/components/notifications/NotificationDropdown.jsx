import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiClock, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <FiAlertCircle className="notification-icon overdue" />;
      case 'due-today':
        return <FiAlertCircle className="notification-icon due-today" />;
      case 'due-tomorrow':
        return <FiClock className="notification-icon due-tomorrow" />;
      case 'due-soon':
        return <FiClock className="notification-icon due-soon" />;
      case 'task-created':
        return <FiCheckCircle className="notification-icon task-created" />;
      default:
        return <FiBell className="notification-icon" />;
    }
  };

  const getNotificationClass = (notification) => {
    const classes = ['notification-item'];
    if (!notification.read) classes.push('unread');
    classes.push(notification.type);
    return classes.join(' ');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="notification-dropdown">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Notifications</h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="mark-all-read">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="clear-all" title="Clear all">
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <FiBell className="empty-icon" />
                  <p>No notifications</p>
                  <span>You're all caught up!</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={`/tasks/${notification.taskId}`}
                    className={getNotificationClass(notification)}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.read && <div className="unread-indicator" />}
                  </Link>
                ))
              )}
            </div>

            {notifications.length > 5 && (
              <div className="notification-footer">
                <Link to="/notifications" onClick={() => setIsOpen(false)}>
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
