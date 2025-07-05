import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Heatmap from './Heatmap';
import Forecast from './Forecast';
import Alerts from './Alerts';
import './Dashboard.css';

const Dashboard = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchShelterData();
  }, []);

  const fetchShelterData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:1000/api/predictions', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setShelters(data);
    } catch (err) {
      console.error('Error fetching shelter data:', err);
      setError('Failed to load shelter data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredShelters = shelters
    .filter(shelter => 
      shelter.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(shelter => {
      if (filterBy === 'high') return shelter.predicted_influx > 150;
      if (filterBy === 'medium') return shelter.predicted_influx >= 80 && shelter.predicted_influx <= 150;
      if (filterBy === 'low') return shelter.predicted_influx < 80;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'influx') return b.predicted_influx - a.predicted_influx;
      return 0;
    });

  const getStatusColor = (influx) => {
    if (influx > 150) return 'critical';
    if (influx >= 80) return 'warning';
    return 'normal';
  };

  const getStatusText = (influx) => {
    if (influx > 150) return 'Critical';
    if (influx >= 80) return 'Warning';
    return 'Normal';
  };

  const getStatusIcon = (influx) => {
    if (influx > 150) return '🔴';
    if (influx >= 80) return '🟡';
    return '🟢';
  };

  const tabs = [
    { id: 'dashboard', name: 'Overview', icon: '📊' },
    { id: 'heatmap', name: 'Heatmap', icon: '🗺️' },
    { id: 'forecast', name: 'Forecast', icon: '🔮' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="stats-overview">
              <div className="stat-card total-shelters">
                <div className="stat-icon">🏠</div>
                <div className="stat-info">
                  <h3>{shelters.length}</h3>
                  <p>Total Shelters</p>
                </div>
              </div>
              <div className="stat-card critical-alerts">
                <div className="stat-icon">🔴</div>
                <div className="stat-info">
                  <h3>{shelters.filter(s => s.predicted_influx > 150).length}</h3>
                  <p>Critical Alerts</p>
                </div>
              </div>
              <div className="stat-card avg-influx">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>{shelters.length > 0 ? Math.round(shelters.reduce((sum, s) => sum + s.predicted_influx, 0) / shelters.length) : 0}</h3>
                  <p>Avg Influx</p>
                </div>
              </div>
              <div className="stat-card total-capacity">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{shelters.reduce((sum, s) => sum + s.predicted_influx, 0)}</h3>
                  <p>Total Capacity</p>
                </div>
              </div>
            </div>

            <div className="controls-section">
              <div className="search-container">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search shelters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="filters-container">
                <div className="filter-group">
                  <label>Filter by Status:</label>
                  <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                    <option value="all">All Shelters</option>
                    <option value="high">Critical (&gt;150)</option>
                    <option value="medium">Warning (80-150)</option>
                    <option value="low">Normal (&lt;80)</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Sort by:</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Name</option>
                    <option value="influx">Influx (High to Low)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="shelters-container">
              <div className="shelters-header">
                <h2>Shelter Status</h2>
                <span className="results-count">{filteredShelters.length} shelters found</span>
              </div>
              
              <div className="shelters-grid">
                {filteredShelters.map((shelter, index) => (
                  <div key={index} className={`shelter-card ${getStatusColor(shelter.predicted_influx)}`}>
                    <div className="shelter-header">
                      <div className="shelter-title">
                        <h3>{shelter.name}</h3>
                        <span className={`status-badge ${getStatusColor(shelter.predicted_influx)}`}>
                          {getStatusIcon(shelter.predicted_influx)} {getStatusText(shelter.predicted_influx)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shelter-metrics">
                      <div className="metric">
                        <span className="metric-label">Predicted Influx</span>
                        <span className="metric-value">{shelter.predicted_influx}</span>
                      </div>
                      
                      <div className="metric">
                        <span className="metric-label">Capacity Status</span>
                        <span className={`capacity-indicator ${getStatusColor(shelter.predicted_influx)}`}>
                          {shelter.predicted_influx > 150 ? 'Critical' : 
                           shelter.predicted_influx >= 80 ? 'Moderate' : 'Good'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shelter-actions">
                      <button className="btn-view">View Details</button>
                      <button className="btn-location">Add Location</button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredShelters.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No shelters found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'heatmap':
        return <Heatmap />;
      case 'forecast':
        return <Forecast />;
      case 'alerts':
        return <Alerts />;
      default:
        return <div className="dashboard-content">Dashboard content here</div>;
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Dashboard...</h2>
          <p>Fetching shelter data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchShelterData} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Toronto Shelter Analytics</h1>
            <p>Real-time monitoring and predictive analytics</p>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <span className="welcome-text">Welcome, {user?.username}!</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="dashboard-container">
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
};

export default Dashboard; 