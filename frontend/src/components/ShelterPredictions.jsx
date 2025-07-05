import React, { useState, useEffect } from 'react';
import ShelterHeatmap from './ShelterHeatmap';

const ShelterPredictions = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(null);
    } catch (err) {
      console.error('Error fetching shelter data:', err);
      setError('Failed to load shelter predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading shelter predictions...</h2>
        <p>Please wait while we fetch the latest data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchShelterData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="shelter-predictions">
      <h1>Toronto Shelter Predictions</h1>
      <p>Showing predicted influx for {shelters.length} shelters</p>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Total Shelters</h3>
          <p>{shelters.length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Predicted Influx</h3>
          <p>{Math.round(shelters.reduce((sum, shelter) => sum + shelter.predicted_influx, 0) / shelters.length)}</p>
        </div>
        <div className="stat-card">
          <h3>Highest Predicted Influx</h3>
          <p>{Math.max(...shelters.map(s => s.predicted_influx))}</p>
        </div>
      </div>

      <ShelterHeatmap shelters={shelters} />
      
      <div className="shelter-table">
        <h2>Detailed Predictions</h2>
        <table>
          <thead>
            <tr>
              <th>Shelter Name</th>
              <th>Predicted Influx</th>
            </tr>
          </thead>
          <tbody>
            {shelters.map((shelter, index) => (
              <tr key={index}>
                <td>{shelter.name}</td>
                <td>{shelter.predicted_influx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShelterPredictions; 