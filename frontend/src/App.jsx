import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/dashboard/Dashboard';
import TaskList from './components/tasks/TaskList';
import TaskDetail from './components/tasks/TaskDetail';
import TaskView from './components/tasks/TaskView';
import CreateTask from './components/tasks/CreateTask';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminDashboard from './components/admin/AdminDashboard';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Navbar from './components/layout/Navbar';
import './App.css';
import './styles/base.css';
import './styles/components.css';
import './styles/auth.css';
import './styles/navigation.css';
import './styles/dashboard.css';
import './styles/tasks.css';
import './styles/profile.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? '' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          <Route path="/tasks/create" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskView /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default AppWrapper;
