import React, { useState, useEffect } from 'react';
import './Heatmap.css';

const Heatmap = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState(null);

  useEffect(() => {
    fetchShelterData();
  }, []);

  const fetchShelterData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/predictions');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setShelters(data);
    } catch (err) {
      console.error('Error fetching shelter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (influx) => {
    if (influx > 100) return '#d32f2f'; // Red
    if (influx > 50) return '#f57c00'; // Orange
    if (influx > 20) return '#fbc02d'; // Yellow
    return '#4caf50'; // Green
  };

  const getHeatmapSize = (influx) => {
    if (influx > 100) return 20;
    if (influx > 50) return 16;
    if (influx > 20) return 12;
    return 8;
  };

  if (loading) {
    return (
      <div className="heatmap-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Heatmap...</h2>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h1>Shelter Heatmap</h1>
        <div className="heatmap-legend">
          <div className="legend-item">
            <span className="legend-color high"></span>
            <span>High (&gt;100)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color medium"></span>
            <span>Medium (50-100)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color low"></span>
            <span>Low (20-50)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color very-low"></span>
            <span>Very Low (&lt;20)</span>
          </div>
        </div>
      </div>

      <div className="map-section">
        <div className="map-container">
          <div className="map-placeholder">
            <div className="map-overlay">
              <h3>Interactive Map</h3>
              <p>Map visualization would be integrated here</p>
              <p>Showing {shelters.length} shelters with heatmap overlay</p>
            </div>
            
            {/* Simulated heatmap points */}
            <div className="heatmap-points">
              {shelters.slice(0, 20).map((shelter, index) => (
                <div
                  key={index}
                  className="heatmap-point"
                  style={{
                    backgroundColor: getHeatmapColor(shelter.predicted_influx),
                    width: `${getHeatmapSize(shelter.predicted_influx)}px`,
                    height: `${getHeatmapSize(shelter.predicted_influx)}px`,
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 80 + 10}%`,
                  }}
                  onClick={() => setSelectedShelter(shelter)}
                  title={`${shelter.name}: ${shelter.predicted_influx} predicted influx`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="map-sidebar">
          <h3>Shelter Details</h3>
          {selectedShelter ? (
            <div className="selected-shelter">
              <h4>{selectedShelter.name}</h4>
              <div className="shelter-info">
                <p><strong>Predicted Influx:</strong> {selectedShelter.predicted_influx}</p>
                <p><strong>Status:</strong> 
                  <span className={`status ${selectedShelter.predicted_influx > 50 ? 'high' : 
                    selectedShelter.predicted_influx >= 20 ? 'medium' : 'low'}`}>
                    {selectedShelter.predicted_influx > 50 ? 'High Alert' : 
                     selectedShelter.predicted_influx >= 20 ? 'Moderate' : 'Normal'}
                  </span>
                </p>
              </div>
              <button 
                className="btn-primary"
                onClick={() => setSelectedShelter(null)}
              >
                Close
              </button>
            </div>
          ) : (
            <p>Click on a point to view shelter details</p>
          )}
        </div>
      </div>

      <div className="heatmap-stats">
        <div className="stat-card">
          <h3>Total Shelters</h3>
          <p>{shelters.length}</p>
        </div>
        <div className="stat-card">
          <h3>High Alert Areas</h3>
          <p>{shelters.filter(s => s.predicted_influx > 50).length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Influx</h3>
          <p>{Math.round(shelters.reduce((sum, s) => sum + s.predicted_influx, 0) / shelters.length)}</p>
        </div>
      </div>
    </div>
  );
};

export default Heatmap; 