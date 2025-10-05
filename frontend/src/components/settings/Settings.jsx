import React from 'react';
import { FiSettings, FiUser, FiShield, FiBell, FiGlobe } from 'react-icons/fi';

const Settings = () => {
  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your application preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-icon">
              <FiUser />
            </div>
            <div className="settings-info">
              <h3>Profile Settings</h3>
              <p>Manage your personal information and account details</p>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-icon">
              <FiBell />
            </div>
            <div className="settings-info">
              <h3>Notifications</h3>
              <p>Configure your notification preferences</p>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-icon">
              <FiGlobe />
            </div>
            <div className="settings-info">
              <h3>Language & Region</h3>
              <p>Set your language and regional preferences</p>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-icon">
              <FiShield />
            </div>
            <div className="settings-info">
              <h3>Privacy & Security</h3>
              <p>Manage your privacy settings and security options</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
