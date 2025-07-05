import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './DashboardContent.css';

const DashboardContent = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToMyShelters, setAddingToMyShelters] = useState({});
  const [selectedView, setSelectedView] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState({
    totalShelters: 0,
    criticalShelters: 0,
    warningShelters: 0,
    normalShelters: 0,
    avgUtilization: 0,
    totalCapacity: 0,
    totalPredicted: 0
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchPredictions();
    
    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPredictions();
        setLastRefresh(new Date());
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const calculateAnalytics = useCallback(() => {
    const totalShelters = predictions.length;
    let criticalShelters = 0;
    let warningShelters = 0;
    let normalShelters = 0;
    let totalCapacity = 0;
    let totalPredicted = 0;

    predictions.forEach(prediction => {
      const capacity = prediction.capacity || 100;
      const utilization = (prediction.predicted_influx / capacity) * 100;
      
      totalCapacity += capacity;
      totalPredicted += prediction.predicted_influx;

      if (utilization > 100) {
        criticalShelters++;
      } else if (utilization > 80) {
        warningShelters++;
      } else {
        normalShelters++;
      }
    });

    const avgUtilization = totalCapacity > 0 ? ((totalPredicted / totalCapacity) * 100).toFixed(1) : 0;

    setAnalytics({
      totalShelters,
      criticalShelters,
      warningShelters,
      normalShelters,
      avgUtilization: parseFloat(avgUtilization),
      totalCapacity,
      totalPredicted
    });
  }, [predictions]);

  useEffect(() => {
    if (predictions.length > 0) {
      calculateAnalytics();
    }
  }, [predictions, calculateAnalytics]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            fetchPredictions();
            break;
          case 'g':
            event.preventDefault();
            setSelectedView('grid');
            break;
          case 't':
            event.preventDefault();
            setSelectedView('table');
            break;
          case 'f':
            event.preventDefault();
            document.querySelector('.search-box input')?.focus();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching predictions...');
      const response = await fetch('/api/predictions');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Predictions data:', data);
      setPredictions(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (predictedInflux, capacity) => {
    const utilization = (predictedInflux / capacity) * 100;
    if (utilization > 100) return '#D03737'; // Critical - Red
    if (utilization > 80) return '#FFA500'; // Warning - Orange
    return '#28A745'; // Normal - Green
  };

  const getStatusText = (predictedInflux, capacity) => {
    const utilization = (predictedInflux / capacity) * 100;
    if (utilization > 100) return 'Critical';
    if (utilization > 80) return 'Warning';
    return 'Normal';
  };

  const getStatusIcon = (predictedInflux, capacity) => {
    const utilization = (predictedInflux / capacity) * 100;
    if (utilization > 100) return '🚨';
    if (utilization > 80) return '⚠️';
    return '✅';
  };

  const handleAddToMyShelters = async (shelterName, capacity) => {
    try {
      setAddingToMyShelters(prev => ({ ...prev, [shelterName]: true }));
      
      // Get shelter location data
      const locationResponse = await fetch('/api/shelter-locations');
      let shelterAddress = 'Address to be updated';
      
      if (locationResponse.ok) {
        const locations = await locationResponse.json();
        const shelterLocation = locations.find(loc => loc.name === shelterName);
        if (shelterLocation) {
          shelterAddress = shelterLocation.address;
        }
      }
      
      const response = await fetch('/api/user-shelters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: shelterName,
          address: shelterAddress,
          capacity: capacity
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add shelter: ${response.status}`);
      }
      
      // Show success message
      alert(`${shelterName} has been added to your shelters!`);
    } catch (err) {
      console.error('Error adding shelter:', err);
      alert('Failed to add shelter. Please try again.');
    } finally {
      setAddingToMyShelters(prev => ({ ...prev, [shelterName]: false }));
    }
  };

  const filteredAndSortedPredictions = predictions
    .filter(prediction => {
      const matchesSearch = prediction.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        getStatusText(prediction.predicted_influx, prediction.capacity || 100).toLowerCase() === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'utilization':
          const utilA = (a.predicted_influx / (a.capacity || 100)) * 100;
          const utilB = (b.predicted_influx / (b.capacity || 100)) * 100;
          return utilB - utilA;
        case 'capacity':
          return (b.capacity || 100) - (a.capacity || 100);
        case 'predicted':
          return b.predicted_influx - a.predicted_influx;
        default:
          return 0;
      }
    });

  const handleRefresh = () => {
    fetchPredictions();
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <LoadingSpinner size="large" text="Loading shelter predictions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="error-container">
          <h2>❌ Error Loading Predictions</h2>
          <p>{error}</p>
          <button onClick={fetchPredictions} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Analytics Overview */}
      <div className="analytics-overview">
        <div className="analytics-header">
          <h2>📊 Shelter Analytics Dashboard</h2>
          <p>Real-time shelter occupancy predictions and capacity analysis</p>
          <div className="refresh-info">
            <span className="last-refresh">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <button 
              onClick={handleRefresh}
              className="refresh-btn"
              title="Refresh data (Ctrl+R)"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div className="analytics-grid">
          <div className="analytics-card total-shelters">
            <div className="analytics-icon">🏠</div>
            <div className="analytics-content">
              <h3>Total Shelters</h3>
              <p className="analytics-value">{analytics.totalShelters}</p>
              <span className="analytics-label">Active facilities</span>
            </div>
          </div>
          
          <div className="analytics-card critical-alerts">
            <div className="analytics-icon">🚨</div>
            <div className="analytics-content">
              <h3>Critical Alerts</h3>
              <p className="analytics-value">{analytics.criticalShelters}</p>
              <span className="analytics-label">Over capacity</span>
            </div>
          </div>
          
          <div className="analytics-card warning-alerts">
            <div className="analytics-icon">⚠️</div>
            <div className="analytics-content">
              <h3>Warning Alerts</h3>
              <p className="analytics-value">{analytics.warningShelters}</p>
              <span className="analytics-label">High utilization</span>
            </div>
          </div>
          
          <div className="analytics-card avg-utilization">
            <div className="analytics-icon">📈</div>
            <div className="analytics-content">
              <h3>Avg Utilization</h3>
              <p className="analytics-value">{analytics.avgUtilization}%</p>
              <span className="analytics-label">System-wide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="view-controls">
          <div className="view-toggle">
            <button 
              className={`view-btn ${selectedView === 'grid' ? 'active' : ''}`}
              onClick={() => setSelectedView('grid')}
              title="Grid View (Ctrl+G)"
            >
              <span className="view-icon">⊞</span>
              Grid View
            </button>
            <button 
              className={`view-btn ${selectedView === 'table' ? 'active' : ''}`}
              onClick={() => setSelectedView('table')}
              title="Table View (Ctrl+T)"
            >
              <span className="view-icon">⊟</span>
              Table View
            </button>
          </div>
          
          <div className="search-filter">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search shelters... (Ctrl+F)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="normal">Normal</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="utilization">Sort by Utilization</option>
              <option value="capacity">Sort by Capacity</option>
              <option value="predicted">Sort by Predicted</option>
            </select>
            
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="toggle-label">Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {predictions.length === 0 ? (
        <div className="no-data">
          <h3>No Predictions Available</h3>
          <p>No shelter prediction data is currently available. Please check back later.</p>
        </div>
      ) : (
        <div className={`results-container ${selectedView}`}>
          {selectedView === 'grid' ? (
            <div className="predictions-grid">
              {filteredAndSortedPredictions.map((prediction, index) => {
                const capacity = prediction.capacity || 100;
                const statusColor = getStatusColor(prediction.predicted_influx, capacity);
                const statusText = getStatusText(prediction.predicted_influx, capacity);
                const statusIcon = getStatusIcon(prediction.predicted_influx, capacity);
                const utilization = ((prediction.predicted_influx / capacity) * 100).toFixed(1);
                const available = Math.max(0, capacity - prediction.predicted_influx);
                
                return (
                  <div key={index} className="prediction-card">
                    <div className="prediction-header">
                      <div className="shelter-info">
                        <h3>{prediction.name}</h3>
                        <div className="status-indicator">
                          <span className="status-icon">{statusIcon}</span>
                          <span className="status-text">{statusText}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToMyShelters(prediction.name, capacity)}
                        disabled={addingToMyShelters[prediction.name]}
                        className="add-to-shelters-btn"
                        title="Add to Your Shelters"
                      >
                        {addingToMyShelters[prediction.name] ? (
                          <>
                            <LoadingSpinner size="small" />
                            Adding...
                          </>
                        ) : (
                          '+'
                        )}
                      </button>
                    </div>
                    
                    <div className="utilization-bar">
                      <div className="bar-container">
                        <div 
                          className="utilization-fill"
                          style={{ 
                            width: `${Math.min(100, utilization)}%`,
                            backgroundColor: statusColor
                          }}
                        ></div>
                      </div>
                      <span className="utilization-text">{utilization}%</span>
                    </div>
                    
                    <div className="prediction-stats">
                      <div className="stat-item">
                        <span className="stat-label">Predicted Influx</span>
                        <span className="stat-value">{prediction.predicted_influx}</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">Capacity</span>
                        <span className="stat-value">{capacity}</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">Available</span>
                        <span className="stat-value" style={{ color: available > 0 ? '#28A745' : '#D03737' }}>
                          {available}
                        </span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">Utilization</span>
                        <span className="stat-value" style={{ color: statusColor }}>
                          {utilization}%
                        </span>
                      </div>
                    </div>

                    <div className="prediction-footer">
                      <span className="prediction-date">
                        Last updated: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="predictions-table">
              <table>
                <thead>
                  <tr>
                    <th>Shelter Name</th>
                    <th>Status</th>
                    <th>Predicted Influx</th>
                    <th>Capacity</th>
                    <th>Available</th>
                    <th>Utilization</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPredictions.map((prediction, index) => {
                    const capacity = prediction.capacity || 100;
                    const statusColor = getStatusColor(prediction.predicted_influx, capacity);
                    const statusText = getStatusText(prediction.predicted_influx, capacity);
                    const statusIcon = getStatusIcon(prediction.predicted_influx, capacity);
                    const utilization = ((prediction.predicted_influx / capacity) * 100).toFixed(1);
                    const available = Math.max(0, capacity - prediction.predicted_influx);
                    
                    return (
                      <tr key={index}>
                        <td className="shelter-name">{prediction.name}</td>
                        <td>
                          <div className="table-status">
                            <span className="status-icon">{statusIcon}</span>
                            <span className="status-text">{statusText}</span>
                          </div>
                        </td>
                        <td>{prediction.predicted_influx}</td>
                        <td>{capacity}</td>
                        <td style={{ color: available > 0 ? '#28A745' : '#D03737' }}>
                          {available}
                        </td>
                        <td style={{ color: statusColor }}>{utilization}%</td>
                        <td>
                          <button
                            onClick={() => handleAddToMyShelters(prediction.name, capacity)}
                            disabled={addingToMyShelters[prediction.name]}
                            className="table-add-btn"
                            title="Add to Your Shelters"
                          >
                            {addingToMyShelters[prediction.name] ? 'Adding...' : '+'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardContent; 