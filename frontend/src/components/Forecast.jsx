import React, { useState, useEffect } from 'react';
import './Forecast.css';

const Forecast = () => {
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState('');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    setLoadingShelters(true);
    setError('');
    
    try {
      console.log('Fetching shelters...');
      const response = await fetch('/api/shelters', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Shelters data:', data);
      
      if (data.shelters && Array.isArray(data.shelters)) {
        setShelters(data.shelters);
        console.log('Shelters set successfully:', data.shelters.length, 'shelters');
      } else {
        console.error('Invalid shelters data format:', data);
        setError('Invalid shelters data format');
      }
    } catch (err) {
      console.error('Error fetching shelters:', err);
      setError(`Failed to load shelters: ${err.message}`);
    } finally {
      setLoadingShelters(false);
    }
  };

  const fetchForecast = async () => {
    if (!selectedShelter) return;

    setLoading(true);
    setError('');
    setForecast(null);

    try {
      const response = await fetch(`/api/forecast?shelter=${encodeURIComponent(selectedShelter)}&days=7`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setForecast(data);
      }
    } catch (err) {
      setError('Failed to load forecast');
      console.error('Error fetching forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShelterChange = (e) => {
    setSelectedShelter(e.target.value);
  };

  const handleGetForecast = () => {
    fetchForecast();
  };

  return (
    <div className="forecast-container">
      <h2>Shelter Forecast</h2>
      
      <div className="forecast-controls">
        <div className="shelter-selector">
          <label htmlFor="shelter-select">Select Shelter:</label>
          {loadingShelters ? (
            <div className="loading-shelters">Loading shelters...</div>
          ) : (
            <select 
              id="shelter-select" 
              value={selectedShelter} 
              onChange={handleShelterChange}
            >
              <option value="">Choose a shelter... ({shelters.length} available)</option>
              {shelters.map((shelter, index) => (
                <option key={index} value={shelter}>
                  {shelter}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <button 
          onClick={handleGetForecast} 
          disabled={!selectedShelter || loading || loadingShelters}
          className="forecast-btn"
        >
          {loading ? 'Loading...' : 'Get 7-Day Forecast'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {forecast && (
        <div className="forecast-results">
          <h3>7-Day Forecast for {forecast.shelter}</h3>
          <div className="forecast-grid">
            {forecast.forecast.map((day, index) => (
              <div key={index} className="forecast-day">
                <div className="day-header">
                  <span className="day-number">Day {day.day}</span>
                  <span className="day-date">{day.date}</span>
                </div>
                <div className="occupancy-prediction">
                  <span className="prediction-label">Predicted Occupancy:</span>
                  <span className="prediction-value">{day.predicted_occupancy}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="forecast-meta">
            <p><strong>Generated:</strong> {new Date(forecast.generated_at).toLocaleString()}</p>
            <p><strong>Latest Data Date:</strong> {forecast.latest_data_date}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecast; 