import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Heatmap from './components/Heatmap';
import Alerts from './components/Alerts';
import Forecast from './components/Forecast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'heatmap', name: 'Heatmap', icon: '🗺️' },
    { id: 'forecast', name: 'Forecast', icon: '🔮' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'heatmap':
        return <Heatmap />;
      case 'forecast':
        return <Forecast />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App">
      <div className="app-header">
        <div className="header-content">
          <h1>Toronto Shelter Analytics</h1>
          <p>Real-time shelter monitoring and prediction system</p>
        </div>
      </div>
      
      <div className="app-container">
        <nav className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </nav>
        
        <main className="tab-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
