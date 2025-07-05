import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardContent from './DashboardContent';
import RecommendationsContent from './RecommendationsContent';
import YourSheltersContent from './YourSheltersContent';
import AlertsContent from './AlertsContent';
import './DashboardTabs.css';
import logo from '../images/LOGO.png';

const DashboardTabs = () => {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '📊',
      description: 'Overview & Analytics'
    },
    {
      id: 'recommendations',
      name: 'AI Recommendations',
      icon: '🤖',
      description: 'Smart Insights'
    },
    {
      id: 'your-shelters',
      name: 'Your Shelters',
      icon: '🏠',
      description: 'Personalized View'
    },
    {
      id: 'alerts',
      name: 'Alerts',
      icon: '🚨',
      description: 'Notifications'
    }
  ];

  return (
    <div className="dashboard-tabs">
      <div className="dashboard-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="dashboard-logo" />
          <div className="header-text">
            <h1>Toronto Shelter Analytics</h1>
            <p>Intelligent shelter management platform</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <span className="user-name">Admin User</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <div className="tab-content">
                <span className="tab-name">{tab.name}</span>
                <span className="tab-description">{tab.description}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="tab-content-area">
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'recommendations' && <RecommendationsContent />}
          {activeTab === 'your-shelters' && <YourSheltersContent />}
          {activeTab === 'alerts' && <AlertsContent />}
        </div>
      </div>
    </div>
  );
};

export default DashboardTabs; 