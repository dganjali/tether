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
    if (utilization > 100) return 'critical';
    if (utilization > 80) return 'warning';
    return 'normal';
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
          <h2>Shelter Analytics Dashboard</h2>
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
              Refresh
            </button>
          </div>
        </div>
        
        <div className="analytics-grid">
          <div className="analytics-card total-shelters">
            <div className="analytics-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <div className="analytics-content">
              <h3>Total Shelters</h3>
              <p className="analytics-value">{analytics.totalShelters}</p>
              <span className="analytics-label">Active facilities</span>
            </div>
          </div>
          
          <div className="analytics-card critical-alerts">
            <div className="analytics-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm-2 15h4v2h-4v-2zm0-8h4v6h-4V9z"/>
              </svg>
            </div>
            <div className="analytics-content">
              <h3>Critical Alerts</h3>
              <p className="analytics-value">{analytics.criticalShelters}</p>
              <span className="analytics-label">Over capacity</span>
            </div>
          </div>
          
          <div className="analytics-card warning-alerts">
            <div className="analytics-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="analytics-content">
              <h3>Warning Alerts</h3>
              <p className="analytics-value">{analytics.warningShelters}</p>
              <span className="analytics-label">High utilization</span>
            </div>
          </div>
          
          <div className="analytics-card avg-utilization">
            <div className="analytics-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
              </svg>
            </div>
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
              <span className="view-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
                </svg>
              </span>
              Grid View
            </button>
            <button 
              className={`view-btn ${selectedView === 'table' ? 'active' : ''}`}
              onClick={() => setSelectedView('table')}
              title="Table View (Ctrl+T)"
            >
              <span className="view-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
              </span>
              Table View
            </button>
            <button 
              className={`view-btn ${selectedView === 'charts' ? 'active' : ''}`}
              onClick={() => setSelectedView('charts')}
              title="Charts View"
            >
              <span className="view-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
              </span>
              Charts View
            </button>
          </div>
          
          <div className="search-filter">
            <div className="search-box">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </span>
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
          {selectedView === 'grid' && (
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
                          <span className={`status-icon ${statusIcon}`}></span>
                          <span className="status-text">{statusText}</span>
                        </div>
                      </div>
                      <div className="header-actions">

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
          )}

          {selectedView === 'table' && (
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
                            <span className={`status-icon ${statusIcon}`}></span>
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

          {selectedView === 'charts' && (
            <div className="charts-container">
              <ShelterCharts 
                predictions={filteredAndSortedPredictions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Shelter Charts Component
const ShelterCharts = ({ predictions }) => {
  const [selectedShelter, setSelectedShelter] = useState('');
  const [chartType, setChartType] = useState('occupancy');

  const shelters = predictions.map(p => p.name);

  const getShelterData = (shelterName) => {
    const prediction = predictions.find(p => p.name === shelterName);
    
    return {
      prediction,
      hasData: !!prediction
    };
  };

  const renderBarChart = (shelterName) => {
    const data = getShelterData(shelterName);
    if (!data.hasData) return <p>No data available for this shelter</p>;

    const maxValue = Math.max(
      data.prediction?.predicted_influx || 0,
      data.prediction?.capacity || 0
    );

    return (
      <div className="bar-chart">
        <div className="chart-header">
          <h4>{shelterName} - Occupancy Data</h4>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color predicted"></span>
              Predicted
            </span>
            <span className="legend-item">
              <span className="legend-color capacity"></span>
              Capacity
            </span>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-y-axis">
            <div className="y-axis-label">Count</div>
            <div className="y-axis-ticks">
              {[0, Math.round(maxValue * 0.25), Math.round(maxValue * 0.5), Math.round(maxValue * 0.75), maxValue].map(tick => (
                <div key={tick} className="y-tick">
                  <span className="tick-label">{tick}</span>
                  <div className="tick-line"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-bars">
            <div className="x-axis">
              <div className="x-tick">
                <div className="bars-group">
                  {/* Predicted bar */}
                  {data.prediction && (
                    <div 
                      className="bar predicted"
                      style={{ 
                        height: `${(data.prediction.predicted_influx / maxValue) * 200}px`,
                        width: '60px'
                      }}
                      title={`Predicted: ${data.prediction.predicted_influx} people`}
                    >
                      <span className="bar-value">{data.prediction.predicted_influx}</span>
                    </div>
                  )}
                  
                  {/* Capacity bar */}
                  {data.prediction && (
                    <div 
                      className="bar capacity"
                      style={{ 
                        height: `${(data.prediction.capacity / maxValue) * 200}px`,
                        width: '60px'
                      }}
                      title={`Capacity: ${data.prediction.capacity} people`}
                    >
                      <span className="bar-value">{data.prediction.capacity}</span>
                    </div>
                  )}
                </div>
                
                <div className="x-labels">
                  <div className="x-label">Predicted</div>
                  <div className="x-label">Capacity</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="charts-view">
      <div className="charts-controls">
        <div className="chart-selector">
          <label htmlFor="shelter-select">Select Shelter:</label>
          <select
            id="shelter-select"
            value={selectedShelter}
            onChange={(e) => setSelectedShelter(e.target.value)}
          >
            <option value="">Choose a shelter...</option>
            {shelters.map(shelter => (
              <option key={shelter} value={shelter}>{shelter}</option>
            ))}
          </select>
        </div>
        
        <div className="chart-type-selector">
          <label htmlFor="chart-type">Chart Type:</label>
          <select
            id="chart-type"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="occupancy">Occupancy Comparison</option>
            <option value="utilization">Utilization Rate</option>
            <option value="trends">Historical Trends</option>
          </select>
        </div>
      </div>
      
      {selectedShelter ? (
        <div className="chart-content">
          {chartType === 'occupancy' && renderBarChart(selectedShelter)}
          {chartType === 'utilization' && (
            <div className="utilization-chart">
              <h4>Utilization Rate Analysis</h4>
              <p>Utilization chart for {selectedShelter} coming soon...</p>
            </div>
          )}
          {chartType === 'trends' && (
            <div className="trends-chart">
              <h4>Historical Trends</h4>
              <p>Trends chart for {selectedShelter} coming soon...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="no-chart-selected">
          <h4>Select a shelter to view charts</h4>
          <p>Choose a shelter from the dropdown above to see detailed charts and analytics.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardContent; 