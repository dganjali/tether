import React, { useState, useEffect } from 'react';
import './styles.css';

const Alerts = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState('all');

  useEffect(() => {
    fetchShelterData();
  }, []);

  const fetchShelterData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/predictions', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
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

  const getAlertLevel = (influx) => {
    if (influx > 100) return { level: 'critical', color: '#d32f2f', icon: '🚨' };
    if (influx > 50) return { level: 'high', color: '#f57c00', icon: '⚠️' };
    if (influx > 20) return { level: 'medium', color: '#fbc02d', icon: '⚡' };
    return { level: 'low', color: '#4caf50', icon: '✅' };
  };

  const filteredAlerts = shelters
    .filter(shelter => {
      if (alertFilter === 'all') return true;
      if (alertFilter === 'critical') return shelter.predicted_influx > 100;
      if (alertFilter === 'high') return shelter.predicted_influx > 50;
      if (alertFilter === 'medium') return shelter.predicted_influx > 20;
      return shelter.predicted_influx <= 20;
    })
    .sort((a, b) => b.predicted_influx - a.predicted_influx);

  return (
    <div className="alerts-container flex flex-column">
      <header>
        <h1>Alerts</h1>
        <select
          value={alertFilter}
          onChange={(e) => setAlertFilter(e.target.value)}
          aria-label="Filter alerts by level"
        >
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="alerts-list" role="list">
          {filteredAlerts.map((shelter, index) => {
            const { level, color, icon } = getAlertLevel(shelter.predicted_influx);
            return (
              <li
                key={index}
                className="alert-item card"
                style={{ borderLeft: `5px solid ${color}` }}
                role="listitem"
                aria-label={`Shelter ${shelter.name}, Alert Level: ${level}`}
              >
                <h3>{shelter.name}</h3>
                <p>{icon} Predicted Influx: {shelter.predicted_influx}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Alerts;