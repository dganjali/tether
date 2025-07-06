import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './styles.css';

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
      <div className="flex flex-column text-center">
        <header>
          <h1>Dashboard</h1>
        </header>

        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Dashboard</h2>
          <p>Fetching shelter data and predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-column text-center">
      <header>
        <h1>Dashboard</h1>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p className="text-bold text-center" style={{ color: 'red' }}>{error}</p>}

      <div className="card">
        <h2>Predictions</h2>
        {predictions.length > 0 ? (
          <ul>
            {predictions.map((prediction, index) => (
              <li key={index}>{prediction.name} - Capacity: {prediction.capacity}</li>
            ))}
          </ul>
        ) : (
          <p>No predictions available</p>
        )}
      </div>

      <div className="card">
        <h2>Recommendations</h2>
        {recommendations.length > 0 ? (
          <ul>
            {recommendations.map((recommendation, index) => (
              <li key={index}>{recommendation.name} - Influx: {recommendation.influx}</li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available</p>
        )}
      </div>

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;