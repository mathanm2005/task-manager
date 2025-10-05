import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiUserX, FiShield, FiActivity, FiTrash2, FiEdit, FiEye } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState({ recentUsers: [], recentTasks: [] });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/users')
      ]);

      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data);
      setRecentActivity({
        recentUsers: usersRes.data.data.slice(0, 5),
        recentTasks: statsRes.data.data.recentTasks || []
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, { role: newRole });
      toast.success('User role updated successfully');
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      await axios.put(`/api/admin/users/${userId}`, { isActive: !user.isActive });
      toast.success('User status updated successfully');
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        toast.success('User deleted successfully');
        fetchAdminData(); // Refresh data
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-spinner">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-layout">
        {/* Navigation Sidebar */}
        <div className="admin-sidebar">
          <div className="sidebar-section">
            <h3>Recent Registrations</h3>
            <div className="registration-list">
              {users.slice(0, 8).map(user => (
                <div key={user._id} className="registration-item">
                  <div className="registration-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="registration-info">
                    <div className="registration-email">{user.email}</div>
                    <div className="registration-time">
                      {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sidebar-stats">
              <div className="stat-item">
                <span className="stat-label">Total Registered:</span>
                <span className="stat-value">{users.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Today:</span>
                <span className="stat-value">
                  {users.filter(user => {
                    const today = new Date();
                    const userDate = new Date(user.createdAt);
                    return userDate.toDateString() === today.toDateString();
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main-content">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Manage users and monitor system activity</p>
          </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{stats?.users.total || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiUserCheck />
          </div>
          <div className="stat-content">
            <h3>{stats?.users.active || 0}</h3>
            <p>Active Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiShield />
          </div>
          <div className="stat-content">
            <h3>{stats?.users.admin || 0}</h3>
            <p>Admin Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiActivity />
          </div>
          <div className="stat-content">
            <h3>{stats?.tasks.total || 0}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="admin-section">
        <div className="section-header">
          <h2>User Management</h2>
          <div className="section-actions">
            <span className="user-count">
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <button className="refresh-btn" onClick={fetchAdminData}>
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`role-select ${user.role === 'admin' ? 'admin' : 'user'}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="date-info">
                      <div className="date-primary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="date-secondary">
                        {new Date(user.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {user.lastLogin ? (
                        <>
                          <div className="date-primary">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                          <div className="date-secondary">
                            {new Date(user.lastLogin).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        <span className="no-data">Never</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="action-btn view"
                        onClick={() => openUserModal(user)}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="action-btn toggle-status"
                        onClick={() => handleStatusToggle(user._id)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <FiUserX /> : <FiUserCheck />}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Delete User"
                        disabled={user.role === 'admin'}
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
      </div>

      {/* Recent Activity */}
      <div className="admin-section">
        <h2>Recent Activity</h2>
        <div className="activity-grid">
          <div className="activity-card">
            <h3>Recent Users</h3>
            <div className="activity-list">
              {recentActivity.recentUsers.map(user => (
                <div key={user._id} className="activity-item">
                  <div className="activity-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{user.name}</p>
                    <p className="activity-meta">
                      Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <h3>Recent Tasks</h3>
            <div className="activity-list">
              {recentActivity.recentTasks.map(task => (
                <div key={task._id} className="activity-item">
                  <div className="activity-icon">📋</div>
                  <div className="activity-content">
                    <p className="activity-text">{task.title}</p>
                    <p className="activity-meta">
                      Created by: {task.createdBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail">
                <label>Name:</label>
                <span>{selectedUser.name}</span>
              </div>
              <div className="user-detail">
                <label>Email:</label>
                <span>{selectedUser.email}</span>
              </div>
              <div className="user-detail">
                <label>Role:</label>
                <span className={`role-badge ${selectedUser.role}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div className="user-detail">
                <label>Status:</label>
                <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="user-detail">
                <label>Member Since:</label>
                <span>
                  {new Date(selectedUser.createdAt).toLocaleDateString()} at {new Date(selectedUser.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="user-detail">
                <label>Last Login:</label>
                <span>
                  {selectedUser.lastLogin 
                    ? new Date(selectedUser.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
