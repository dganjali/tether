import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardContent from './DashboardContent';
import RecommendationsContent from './RecommendationsContent';
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

  return (
    <div className="dashboard-tabs">
      <div className="dashboard-header">
        <img src={logo} alt="Logo" className="dashboard-logo" />
        <h1>Toronto Shelter Analytics</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => handleTabChange('recommendations')}
          >
            🤖 AI Recommendations
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'recommendations' && <RecommendationsContent />}
        </div>
      </div>
    </div>
  );
};

export default DashboardTabs; 