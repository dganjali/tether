import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './DashboardContent.css';

const DashboardContent = () => {
  const { user } = useContext(AuthContext);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToMyShelters, setAddingToMyShelters] = useState({});

  useEffect(() => {
    fetchPredictions();
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

  const handleAddToMyShelters = async (shelterName, capacity) => {
    try {
      setAddingToMyShelters(prev => ({ ...prev, [shelterName]: true }));
      
      const response = await fetch('/api/user-shelters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: shelterName,
          address: 'Address to be updated',
          capacity: capacity
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add shelter: ${response.status}`);
      }
      
      // Show success message or redirect to Your Shelters tab
      alert(`${shelterName} has been added to your shelters!`);
    } catch (err) {
      console.error('Error adding shelter:', err);
      alert('Failed to add shelter. Please try again.');
    } finally {
      setAddingToMyShelters(prev => ({ ...prev, [shelterName]: false }));
    }
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
      <div className="content-header">
        <h2>Shelter Predictions Dashboard</h2>
        <p>Current shelter occupancy predictions and capacity analysis</p>
      </div>

      {predictions.length === 0 ? (
        <div className="no-data">
          <h3>No Predictions Available</h3>
          <p>No shelter prediction data is currently available. Please check back later.</p>
        </div>
      ) : (
        <div className="predictions-grid">
          {predictions.map((prediction, index) => {
            const capacity = prediction.capacity || 100;
            const statusColor = getStatusColor(prediction.predicted_influx, capacity);
            const statusText = getStatusText(prediction.predicted_influx, capacity);
            const utilization = ((prediction.predicted_influx / capacity) * 100).toFixed(1);
            
            return (
              <div key={index} className="prediction-card">
                <div className="prediction-header">
                  <h3>{prediction.name}</h3>
                  <div className="header-actions">
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: statusColor }}
                    >
                      {statusText}
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
                    <span className="stat-label">Utilization</span>
                    <span className="stat-value" style={{ color: statusColor }}>
                      {utilization}%
                    </span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Available</span>
                    <span className="stat-value">
                      {Math.max(0, capacity - prediction.predicted_influx)}
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
    </div>
  );
};

export default DashboardContent; 