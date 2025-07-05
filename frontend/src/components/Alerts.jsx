import React, { useState, useEffect } from 'react';
import './Alerts.css';

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

  const criticalAlerts = shelters.filter(s => s.predicted_influx > 100).length;
  const highAlerts = shelters.filter(s => s.predicted_influx > 50 && s.predicted_influx <= 100).length;
  const mediumAlerts = shelters.filter(s => s.predicted_influx > 20 && s.predicted_influx <= 50).length;

  if (loading) {
    return (
      <div className="alerts-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Alerts...</h2>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>Influx Alerts</h1>
        <div className="alerts-summary">
          <div className="summary-item critical">
            <span className="summary-icon">🚨</span>
            <span className="summary-number">{criticalAlerts}</span>
            <span className="summary-label">Critical</span>
          </div>
          <div className="summary-item high">
            <span className="summary-icon">⚠️</span>
            <span className="summary-number">{highAlerts}</span>
            <span className="summary-label">High</span>
          </div>
          <div className="summary-item medium">
            <span className="summary-icon">⚡</span>
            <span className="summary-number">{mediumAlerts}</span>
            <span className="summary-label">Medium</span>
          </div>
        </div>
      </div>

      <div className="alerts-controls">
        <select value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)}>
          <option value="all">All Alerts</option>
          <option value="critical">Critical (&gt;100)</option>
          <option value="high">High (50-100)</option>
          <option value="medium">Medium (20-50)</option>
          <option value="low">Low (&lt;20)</option>
        </select>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map((shelter, index) => {
          const alertInfo = getAlertLevel(shelter.predicted_influx);
          return (
            <div key={index} className={`alert-item ${alertInfo.level}`}>
              <div className="alert-icon">
                {alertInfo.icon}
              </div>
              
              <div className="alert-content">
                <div className="alert-header">
                  <h3>{shelter.name}</h3>
                  <span className={`alert-badge ${alertInfo.level}`}>
                    {alertInfo.level.toUpperCase()}
                  </span>
                </div>
                
                <div className="alert-details">
                  <p><strong>Predicted Influx:</strong> {shelter.predicted_influx}</p>
                  <p><strong>Alert Level:</strong> {alertInfo.level}</p>
                  <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
                </div>
                
                <div className="alert-actions">
                  <button className="btn-primary">View Details</button>
                  <button className="btn-secondary">Dismiss</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="no-alerts">
          <h3>No alerts found</h3>
          <p>All shelters are operating within normal capacity</p>
        </div>
      )}

      <div className="alerts-footer">
        <div className="footer-stats">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p>Total alerts: {filteredAlerts.length}</p>
        </div>
        <button className="btn-primary" onClick={fetchShelterData}>
          Refresh Alerts
        </button>
      </div>
    </div>
  );
};

export default Alerts; 