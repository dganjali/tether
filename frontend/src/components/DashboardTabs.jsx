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
      name: 'Public Dashboard',
      description: 'Overview & Analytics'
    },
    {
      id: 'recommendations',
      name: 'AI Recommendations',
      description: 'Smart Insights'
    },
    {
      id: 'your-shelters',
      name: 'Your Shelters',
      description: 'Personalized View'
    },
    {
      id: 'alerts',
      name: 'Alerts',
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
            <span className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </span>
            <span className="user-name">Admin User</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </span>
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