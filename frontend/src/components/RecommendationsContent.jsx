import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './RecommendationsContent.css';

const RecommendationsContent = () => {
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingRecommendations, setFetchingRecommendations] = useState(false);
  const [error, setError] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [selectedPredictedInflux, setSelectedPredictedInflux] = useState('');

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching predictions for recommendations...');
      const response = await fetch('/api/predictions');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Predictions data for recommendations:', data);
      setPredictions(data);
      
      // Set default selected shelter if available
      if (data.length > 0) {
        setSelectedShelter(data[0].name);
        setSelectedPredictedInflux(data[0].predicted_influx || 0);
        // Set a realistic capacity based on the predicted influx
        const realisticCapacity = Math.max(50, Math.floor((data[0].predicted_influx || 0) * 0.8));
        setSelectedCapacity(realisticCapacity);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!selectedShelter || !selectedPredictedInflux || !selectedCapacity) return;
    
    try {
      setFetchingRecommendations(true);
      setError(null);
      
      console.log('Fetching recommendations for:', selectedShelter, selectedPredictedInflux, selectedCapacity);
      const response = await fetch(`/api/recommendations?shelter=${encodeURIComponent(selectedShelter)}&influx=${selectedPredictedInflux}&capacity=${selectedCapacity}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Recommendations API error:', response.status, errorText);
        throw new Error(`Failed to fetch recommendations: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Recommendations data:', data);
      setRecommendations([data]); // Store as array for consistency
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setFetchingRecommendations(false);
    }
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

  const handleShelterChange = (shelterName) => {
    setSelectedShelter(shelterName);
    // Find the prediction for this shelter
    const prediction = predictions.find(p => p.name === shelterName);
    if (prediction) {
      setSelectedPredictedInflux(prediction.predicted_influx || 0);
      // Set a realistic capacity based on the predicted influx
      const realisticCapacity = Math.max(50, Math.floor((prediction.predicted_influx || 0) * 0.8));
      setSelectedCapacity(realisticCapacity);
    }
  };

  if (loading) {
    return (
      <div className="recommendations-content">
        <LoadingSpinner size="large" text="Loading shelter data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-content">
        <div className="error-container">
          <h2>❌ Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchPredictions} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-content">
      <div className="content-header">
        <h2>AI-Powered Recommendations</h2>
        <p>Get intelligent resource allocation recommendations based on predicted influx</p>
      </div>

      <div className="recommendations-controls">
        <div className="form-group">
          <label>Select Shelter:</label>
          <select 
            value={selectedShelter} 
            onChange={(e) => handleShelterChange(e.target.value)}
            className="form-control"
          >
            <option value="">Choose a shelter...</option>
            {predictions.map((prediction, index) => (
              <option key={index} value={prediction.name}>
                {prediction.name} (Predicted: {prediction.predicted_influx})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Predicted Influx:</label>
          <input
            type="number"
            value={selectedPredictedInflux}
            onChange={(e) => setSelectedPredictedInflux(e.target.value)}
            className="form-control"
            placeholder="Enter predicted influx"
          />
        </div>

        <div className="form-group">
          <label>Shelter Capacity:</label>
          <input
            type="number"
            value={selectedCapacity}
            onChange={(e) => setSelectedCapacity(e.target.value)}
            className="form-control"
            placeholder="Enter shelter capacity"
          />
        </div>
        
        <button 
          onClick={fetchRecommendations}
          disabled={!selectedShelter || !selectedPredictedInflux || !selectedCapacity || fetchingRecommendations}
          className="btn btn-primary"
        >
          {fetchingRecommendations ? (
            <>
              <LoadingSpinner size="small" />
              Getting AI Recommendations...
            </>
          ) : (
            'Get AI Recommendations'
          )}
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

      {predictions.length === 0 && (
        <div className="no-data">
          <h3>No Shelter Data Available</h3>
          <p>No shelter data is currently available to generate recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsContent; 