import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './AlertsContent.css';

const AlertsContent = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, critical, warning, info

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // No alerts found, use mock data for demo
          setAlerts(generateMockAlerts());
          return;
        }
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }
      
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      // Use mock data as fallback
      setAlerts(generateMockAlerts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);



  const generateMockAlerts = () => {
    return [
      {
        id: 1,
        type: 'critical',
        title: 'Capacity Exceeded',
        message: 'Sojourn House is at 120% capacity. Immediate action required.',
        shelter: 'Sojourn House',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: 2,
        type: 'warning',
        title: 'High Occupancy Alert',
        message: 'Junction Place is approaching capacity at 95%.',
        shelter: 'Junction Place',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: 3,
        type: 'info',
        title: 'Weather Advisory',
        message: 'Severe weather expected tonight. Prepare for increased demand.',
        shelter: 'System-wide',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        acknowledged: true
      },
      {
        id: 4,
        type: 'critical',
        title: 'Staff Shortage',
        message: 'Multiple shelters reporting staff shortages for overnight shifts.',
        shelter: 'Multiple Shelters',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: 5,
        type: 'warning',
        title: 'Supply Shortage',
        message: 'Blankets and sleeping bags running low at Family Residence.',
        shelter: 'Family Residence',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        acknowledged: true
      }
    ];
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.status}`);
      }
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setError(err.message);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to dismiss alert: ${response.status}`);
      }
      
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
      setError(err.message);
    }
  };

  const getFilteredAlerts = () => {
    if (filter === 'all') return alerts;
    return alerts.filter(alert => alert.type === filter);
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'critical': return '⚠️';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  if (loading) {
    return (
      <div className="alerts-content">
        <LoadingSpinner size="large" text="Loading alerts..." />
      </div>
    );
  }

  return (
    <div className="alerts-content">
      <div className="content-header">
        <h2>Alerts & Notifications</h2>
        <p>Monitor system alerts and shelter notifications</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      <div className="alerts-section">
        <div className="section-header">
          <h3>Active Alerts</h3>
          <div className="filter-controls">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
              onClick={() => setFilter('critical')}
            >
              Critical
            </button>
            <button
              className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              Warning
            </button>
            <button
              className={`filter-btn ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
            >
              Info
            </button>
          </div>
        </div>

        {getFilteredAlerts().length === 0 ? (
          <div className="no-alerts">
            <h4>No Alerts</h4>
            <p>No alerts match the current filter criteria.</p>
          </div>
        ) : (
          <div className="alerts-list">
            {getFilteredAlerts().map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-card ${alert.type} ${alert.acknowledged ? 'acknowledged' : ''}`}
              >
                <div className="alert-header">
                  <div className="alert-type">
                    <span 
                      className="alert-icon"
                      style={{ color: getAlertTypeColor(alert.type) }}
                    >
                      {getAlertTypeIcon(alert.type)}
                    </span>
                    <span className="alert-title">{alert.title}</span>
                  </div>
                  <div className="alert-actions">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="acknowledge-btn"
                        title="Acknowledge alert"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="dismiss-btn"
                      title="Dismiss alert"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-meta">
                    <span className="alert-shelter">{alert.shelter}</span>
                    <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsContent; 