import React from 'react';

const ShelterHeatmap = ({ shelters }) => {
  return (
    <div className="shelter-heatmap">
      <h2>Shelter Locations</h2>
      <div className="map-container">
        {/* Placeholder for map visualization */}
        <div className="map-placeholder">
          <p>Map visualization would go here</p>
          <p>Showing {shelters.length} shelters</p>
        </div>
      </div>
      <div className="shelter-list">
        {shelters.map((shelter, index) => (
          <div key={index} className="shelter-item">
            <h3>{shelter.name}</h3>
            <p>Predicted Influx: {shelter.predicted_influx}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelterHeatmap; 