import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiList, FiPlus, FiUser, FiLogOut, FiSettings, FiShield, FiUsers, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import axios from 'axios';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRegistrationsOpen, setIsRegistrationsOpen] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const location = useLocation();
  const { user, logout } = useAuth();
  const userMenuRef = useRef(null);
  const registrationsRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.role === 'admin';

  // Debug logging (commented out for production)
  // console.log('Navbar Debug:', {
  //   user,
  //   userRole: user?.role,
  //   isAdmin,
  //   location: location.pathname
  // });

  // Fetch recent users for admin
  useEffect(() => {
    if (isAdmin) {
      fetchRecentUsers();
    }
  }, [isAdmin]);

  const fetchRecentUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users?limit=5');
      setRecentUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching recent users:', error);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (registrationsRef.current && !registrationsRef.current.contains(event.target)) {
        setIsRegistrationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="navbar-logo">
            Task Manager
          </Link>
        </div>

        <div className="navbar-menu">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <FiHome />
                <span>Dashboard</span>
              </Link>

              <Link 
                to="/tasks" 
                className={`navbar-link ${isActive('/tasks') ? 'active' : ''}`}
              >
                <FiList />
                <span>Tasks</span>
              </Link>

              <Link 
                to="/tasks/create" 
                className={`navbar-link ${isActive('/tasks/create') ? 'active' : ''}`}
              >
                <FiPlus />
                <span>Create Task</span>
              </Link>

              <Link 
                to="/tasks/calendar" 
                className={`navbar-link ${isActive('/tasks/calendar') ? 'active' : ''}`}
              >
                <FiCalendar />
                <span>Task Calendar</span>
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    to="/admin" 
                    className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <FiShield />
                    <span>Admin</span>
                  </Link>

                  {isActive('/admin') && (
                    <Link 
                      to="/dashboard" 
                      className="navbar-link"
                      title="Back to Dashboard"
                    >
                      <FiArrowLeft />
                      <span>Back</span>
                    </Link>
                  )}
                  
                  <div className="registrations-menu" ref={registrationsRef}>
                    <button
                      className="navbar-link registrations-button"
                      onClick={() => setIsRegistrationsOpen(!isRegistrationsOpen)}
                    >
                      <FiUsers />
                      <span>Registrations</span>
                      <span className="registration-count">{recentUsers.length}</span>
                    </button>

                    {isRegistrationsOpen && (
                      <div className="registrations-dropdown">
                        <div className="dropdown-header">
                          <h4>Recent Registrations</h4>
                        </div>
                        <div className="registrations-list">
                          {recentUsers.length > 0 ? (
                            recentUsers.map(user => (
                              <div key={user._id} className="registration-dropdown-item">
                                <div className="registration-dropdown-avatar">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="registration-dropdown-info">
                                  <div className="registration-dropdown-email">{user.email}</div>
                                  <div className="registration-dropdown-time">
                                    {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-registrations">No recent registrations</div>
                          )}
                        </div>
                        <div className="dropdown-footer">
                          <Link to="/admin" className="view-all-link">
                            View All Users
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                <FiUser />
                <span>Login</span>
              </Link>
              <Link to="/signup" className="navbar-link">
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className="navbar-user">
            <NotificationDropdown />
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-menu-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-name">{user.name || 'User'}</span>
                {isAdmin && <span className="admin-badge">Admin</span>}
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <FiUser />
                    <span>Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item">
                      <FiShield />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <Link to="/settings" className="dropdown-item">
                    <FiSettings />
                    <span>Settings</span>
                  </Link>
                  <button onClick={logout} className="dropdown-item">
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="mobile-user-details">
                  <div className="mobile-user-name">
                    {user.name || 'User'}
                    {isAdmin && <span className="mobile-admin-badge">Admin</span>}
                  </div>
                  <div className="mobile-user-email">{user.email}</div>
                </div>
              </div>

              <Link 
                to="/dashboard" 
                className={`mobile-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiHome />
                <span>Dashboard</span>
              </Link>

              <Link 
                to="/tasks" 
                className={`mobile-link ${isActive('/tasks') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiList />
                <span>Tasks</span>
              </Link>

              <Link 
                to="/tasks/create" 
                className={`mobile-link ${isActive('/tasks/create') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiPlus />
                <span>Create Task</span>
              </Link>

              <Link 
                to="/tasks/calendar" 
                className={`mobile-link ${isActive('/tasks/calendar') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiCalendar />
                <span>Task Calendar</span>
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    to="/admin" 
                    className={`mobile-link ${isActive('/admin') ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiShield />
                    <span>Admin Panel</span>
                  </Link>

                  {isActive('/admin') && (
                    <Link 
                      to="/dashboard" 
                      className="mobile-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiArrowLeft />
                      <span>Back to Dashboard</span>
                    </Link>
                  )}
                </>
              )}

              <div className="mobile-user-actions">
                <Link to="/profile" className="mobile-action-link">
                  <FiUser />
                  <span>Profile</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="mobile-action-link">
                    <FiShield />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link to="/settings" className="mobile-action-link">
                  <FiSettings />
                  <span>Settings</span>
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="mobile-action-link">
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiUser />
                <span>Login</span>
              </Link>
              <Link 
                to="/signup" 
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
