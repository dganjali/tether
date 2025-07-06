import React, { useState } from 'react';
import './styles.css';

const ShelterHeatmap = ({ shelters }) => {
  const [showMap, setShowMap] = useState(true);

  const toggleMap = () => setShowMap(!showMap);

  return (
    <div className="shelter-heatmap flex flex-column">
      <h2 className="text-center">Shelter Locations</h2>

      <button className="toggle-map-button" onClick={toggleMap} aria-label="Toggle Map">
        {showMap ? 'Hide Map' : 'Show Map'}
      </button>

      {showMap && (
        <div className="map-container flex" role="region" aria-label="Map Visualization">
          {/* Placeholder for map visualization */}
          <div className="map-placeholder card">
            <p>Map visualization would go here</p>
            <p>Showing {shelters.length} shelters</p>
          </div>
        </div>
      )}

      <div className="shelter-list" role="list">
        {shelters.map((shelter, index) => (
          <div
            key={index}
            className="shelter-item card"
            role="listitem"
            tabIndex={0}
            aria-label={`Shelter ${shelter.name}, Predicted Influx: ${shelter.predicted_influx}`}
          >
            <h3>{shelter.name}</h3>
            <p>Predicted Influx: {shelter.predicted_influx}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelterHeatmap;