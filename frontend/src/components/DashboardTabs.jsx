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
      <div className="tabs-container">
        <div className="tabs-header">
          <div className="tabs-left">
            <img src={logo} alt="Logo" className="tabs-logo" />
            <h1>Dashboard</h1>
          </div>
          <div className="tabs-right">
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

        <div className="tabs-navigation">
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