import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';
import logo from '../images/LOGO.png';

const Dashboard = () => {
  const { logout } = useContext(AuthContext);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/predictions');
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }
      const data = await response.json();
      setPredictions(data);
      
      // Set default selected shelter if available
      if (data.length > 0) {
        setSelectedShelter(data[0].name);
        setSelectedCapacity(data[0].capacity || 100);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!selectedShelter || !selectedCapacity) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/recommendations?shelter=${encodeURIComponent(selectedShelter)}&influx=${selectedCapacity}&capacity=${selectedCapacity}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      setRecommendations([data]); // Store as array for consistency
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '✅';
      default: return 'ℹ️';
    }
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <img src={logo} alt="Logo" className="dashboard-logo" />
          <h1>Dashboard</h1>
          <button onClick={handleLogout} className="logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Logout
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Dashboard</h2>
          <p>Fetching shelter data and predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <img src={logo} alt="Logo" className="dashboard-logo" />
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        {/* AI Recommendations Section */}
        <div className="recommendations-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="section-title">
              <h2>AI-Powered Recommendations</h2>
              <p>Get intelligent resource allocation recommendations based on predicted influx</p>
            </div>
          </div>
          
          <div className="recommendations-controls">
            <div className="form-group">
              <label>Select Shelter</label>
              <select 
                value={selectedShelter} 
                onChange={(e) => setSelectedShelter(e.target.value)}
                className="form-control"
              >
                <option value="">Choose a shelter...</option>
                {predictions.map((prediction, index) => (
                  <option key={index} value={prediction.name}>
                    {prediction.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Predicted Influx</label>
              <input
                type="number"
                value={selectedCapacity}
                onChange={(e) => setSelectedCapacity(e.target.value)}
                className="form-control"
                placeholder="Enter predicted influx"
              />
            </div>
            
            <button 
              onClick={fetchRecommendations}
              disabled={!selectedShelter || !selectedCapacity}
              className="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Get AI Recommendations
            </button>
          </div>

          {recommendations.length > 0 && (
            <div className="recommendations-results">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-header">
                    <div className="recommendation-title">
                      <h3>{rec.shelter_name}</h3>
                      <span className="recommendation-subtitle">AI Analysis Report</span>
                    </div>
                    <div className="severity-badge" style={{ backgroundColor: getSeverityColor(rec.severity) }}>
                      {getSeverityIcon(rec.severity)} {rec.severity} SEVERITY
                    </div>
                  </div>
                  
                  <div className="recommendation-stats">
                    <div className="stat-item">
                      <span className="stat-label">Predicted Occupancy</span>
                      <span className="stat-value">{rec.predicted_occupancy}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Capacity</span>
                      <span className="stat-value">{rec.capacity}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Excess</span>
                      <span className="stat-value" style={{ color: getSeverityColor(rec.severity) }}>
                        +{rec.excess}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Utilization</span>
                      <span className="stat-value">{rec.capacity_utilization_rate}%</span>
                    </div>
                  </div>

                  <div className="recommendation-content">
                    <div className="llm-feedback">
                      <h4>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        AI Recommendations
                      </h4>
                      <pre className="recommendation-text">{rec.llm_feedback}</pre>
                    </div>
                    
                    <div className="action-items">
                      <h4>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Immediate Actions
                      </h4>
                      <ul>
                        {rec.action_items && rec.action_items.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Predictions Section */}
        <div className="predictions-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <div className="section-title">
              <h2>Current Predictions</h2>
              <p>Real-time shelter occupancy predictions and capacity analysis</p>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm-2 15h4v2h-4v-2zm0-8h4v6h-4V9z"/>
              </svg>
              {error}
            </div>
          )}
          
          <div className="predictions-grid">
            {predictions.map((prediction, index) => (
              <div key={index} className="prediction-card">
                <div className="prediction-header">
                  <div className="prediction-title">
                    <h3>{prediction.name}</h3>
                    <span className="prediction-date">{new Date().toLocaleDateString()}</span>
                  </div>
                  <span className={`status-badge ${prediction.predicted_influx > (prediction.capacity || 0) ? 'critical' : 'normal'}`}>
                    {prediction.predicted_influx > (prediction.capacity || 0) ? 'Critical' : 'Normal'}
                  </span>
                </div>
                
                <div className="prediction-stats">
                  <div className="stat">
                    <span className="stat-label">Predicted Influx</span>
                    <span className="stat-value">{prediction.predicted_influx}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Capacity</span>
                    <span className="stat-value">{prediction.capacity || 'N/A'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className={`status-badge ${prediction.predicted_influx > (prediction.capacity || 0) ? 'critical' : 'normal'}`}>
                      {prediction.predicted_influx > (prediction.capacity || 0) ? 'Critical' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 