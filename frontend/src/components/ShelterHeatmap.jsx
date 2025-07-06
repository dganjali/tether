import React from 'react';

const ShelterHeatmap = ({ shelters }) => {
  const getStatusColor = (influx) => {
    if (influx > 100) return '#d32f2f'; // Red - Critical
    if (influx > 50) return '#f57c00'; // Orange - High
    if (influx > 20) return '#fbc02d'; // Yellow - Medium
    return '#4caf50'; // Green - Low
  };

  const getStatusText = (influx) => {
    if (influx > 100) return 'Critical';
    if (influx > 50) return 'High';
    if (influx > 20) return 'Medium';
    return 'Low';
  };

  return (
    <div className="shelter-heatmap">
      <h2>Shelter Locations & Predictions</h2>
      <div className="map-container">
        <div className="map-placeholder">
          <p>Map visualization would go here</p>
          <p>Showing {shelters.length} shelters with real data</p>
        </div>
      </div>
      
      <div className="shelter-list">
        {shelters.map((shelter, index) => (
          <div key={index} className="shelter-item">
            <div className="shelter-header">
              <h3>{shelter.name}</h3>
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(shelter.predicted_influx) }}
              >
                {getStatusText(shelter.predicted_influx)}
              </div>
            </div>
            <div className="shelter-details">
              <p><strong>Predicted Influx:</strong> {shelter.predicted_influx}</p>
              <p><strong>Capacity:</strong> {shelter.capacity}</p>
              <p><strong>Utilization:</strong> {Math.round((shelter.predicted_influx / shelter.capacity) * 100)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelterHeatmap; 