import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiMail, FiHeart, FiCalendar, FiUsers, FiSettings } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <h3 className="footer-logo">TaskManager</h3>
            <p className="footer-description">
              A modern task management application to help you stay organized and productive.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="GitHub">
                <FiGithub />
              </a>
              <a href="#" className="social-link" aria-label="Email">
                <FiMail />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-list">
              <li>
                <Link to="/dashboard" className="footer-link">
                  <FiCalendar className="footer-icon" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/tasks" className="footer-link">
                  <FiUsers className="footer-icon" />
                  All Tasks
                </Link>
              </li>
              <li>
                <Link to="/tasks/create" className="footer-link">
                  <FiCalendar className="footer-icon" />
                  Create Task
                </Link>
              </li>
              <li>
                <Link to="/settings" className="footer-link">
                  <FiSettings className="footer-icon" />
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="footer-support">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-list">
              <li>
                <a href="#" className="footer-link">Help Center</a>
              </li>
              <li>
                <a href="#" className="footer-link">Documentation</a>
              </li>
              <li>
                <a href="#" className="footer-link">Contact Us</a>
              </li>
              <li>
                <a href="#" className="footer-link">Report Bug</a>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div className="footer-company">
            <h4 className="footer-title">Company</h4>
            <ul className="footer-list">
              <li>
                <a href="#" className="footer-link">About Us</a>
              </li>
              <li>
                <a href="#" className="footer-link">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="footer-link">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="footer-link">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} TaskManager. Made with <FiHeart className="heart-icon" /> for productivity.
            </p>
            <div className="footer-version">
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
