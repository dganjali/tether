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
    <div className="recommendations-container flex flex-column text-center">
      <header>
        <h1>Recommendations</h1>
      </header>

      {loading && <LoadingSpinner text="Loading predictions..." />}
      {error && <p className="text-bold" style={{ color: 'red' }}>{error}</p>}

      <div className="card">
        <h2>Predictions</h2>
        {predictions.length > 0 ? (
          <ul>
            {predictions.map((prediction, index) => (
              <li key={index}>{prediction.name} - Predicted Influx: {prediction.predicted_influx}</li>
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
              <li key={index}>{recommendation.name} - Capacity: {recommendation.capacity}</li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationsContent;