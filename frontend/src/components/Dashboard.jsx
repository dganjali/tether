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
      case 'HIGH': return '#D03737';
      case 'MEDIUM': return '#FFA500';
      case 'LOW': return '#28A745';
      default: return '#6C757D';
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
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shelter data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <img src={logo} alt="Logo" className="dashboard-logo" />
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="dashboard-content">
        {/* AI Recommendations Section */}
        <div className="recommendations-section">
          <h2>🤖 AI-Powered Recommendations</h2>
          <p>Get intelligent resource allocation recommendations based on predicted influx</p>
          
          <div className="recommendations-controls">
            <div className="form-group">
              <label>Select Shelter:</label>
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
              <label>Predicted Influx:</label>
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
              Get AI Recommendations
            </button>
          </div>

          {recommendations.length > 0 && (
            <div className="recommendations-results">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-header">
                    <h3>{rec.shelter_name}</h3>
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
                      <h4>AI Recommendations</h4>
                      <pre className="recommendation-text">{rec.llm_feedback}</pre>
                    </div>
                    
                    <div className="action-items">
                      <h4>Immediate Actions</h4>
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

        {/* Existing Predictions Section */}
        <div className="predictions-section">
          <h2>📊 Current Predictions</h2>
          {error && <div className="error-message">{error}</div>}
          
          <div className="predictions-grid">
            {predictions.map((prediction, index) => (
              <div key={index} className="prediction-card">
                <div className="prediction-header">
                  <h3>{prediction.name}</h3>
                  <span className="prediction-date">{new Date().toLocaleDateString()}</span>
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