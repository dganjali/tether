import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './AlertsContent.css';

const AlertsContent = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    success: 0,
    acknowledged: 0,
    unacknowledged: 0
  });

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/alerts?type=${filter}`, {
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
      setAlerts(data.alerts || data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      // Use mock data as fallback
      setAlerts(generateMockAlerts());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching alert stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [fetchAlerts, fetchStats]);

  const generateMockAlerts = () => {
    return [
      {
        id: 1,
        type: 'critical',
        title: 'Capacity Exceeded',
        message: 'Sojourn House is at 120% capacity. Immediate action required.',
        shelter: 'Sojourn House',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        priority: 'high'
      },
      {
        id: 2,
        type: 'warning',
        title: 'High Occupancy Alert',
        message: 'Junction Place is approaching capacity at 95%.',
        shelter: 'Junction Place',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        priority: 'medium'
      },
      {
        id: 3,
        type: 'info',
        title: 'Weather Advisory',
        message: 'Severe weather expected tonight. Prepare for increased demand.',
        shelter: 'System-wide',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        priority: 'medium'
      },
      {
        id: 4,
        type: 'critical',
        title: 'Staff Shortage',
        message: 'Multiple shelters reporting staff shortages for overnight shifts.',
        shelter: 'Multiple Shelters',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        priority: 'urgent'
      },
      {
        id: 5,
        type: 'warning',
        title: 'Supply Shortage',
        message: 'Blankets and sleeping bags running low at Family Residence.',
        shelter: 'Family Residence',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        priority: 'medium'
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
      
      // Refresh stats
      fetchStats();
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
      setSelectedAlerts(selectedAlerts.filter(id => id !== alertId));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error dismissing alert:', err);
      setError(err.message);
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return;
    
    try {
      const response = await fetch('/api/alerts/bulk-acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ alertIds: selectedAlerts })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to bulk acknowledge alerts: ${response.status}`);
      }
      
      setAlerts(alerts.map(alert => 
        selectedAlerts.includes(alert.id) ? { ...alert, acknowledged: true } : alert
      ));
      setSelectedAlerts([]);
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error bulk acknowledging alerts:', err);
      setError(err.message);
    }
  };

  const handleSelectAlert = (alertId) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(alert => alert.id));
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      case 'success': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'critical':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm-2 15h4v2h-4v-2zm0-8h4v6h-4V9z"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        );
      case 'info':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
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

      {/* Alert Statistics */}
      <div className="alert-stats">
        <div className="stat-card">
          <div className="stat-icon critical">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm-2 15h4v2h-4v-2zm0-8h4v6h-4V9z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Critical</h3>
            <p>{stats.critical}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Warning</h3>
            <p>{stats.warning}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Info</h3>
            <p>{stats.info}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total</h3>
            <p>{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="alerts-controls">
        <div className="filter-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Alerts</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
          </select>
        </div>
        
        {selectedAlerts.length > 0 && (
          <div className="bulk-actions">
            <button 
              onClick={handleBulkAcknowledge}
              className="bulk-acknowledge-btn"
            >
              Acknowledge Selected ({selectedAlerts.length})
            </button>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <h3>No Alerts</h3>
            <p>No alerts match the current filter criteria.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''} ${selectedAlerts.includes(alert.id) ? 'selected' : ''}`}
            >
              <div className="alert-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAlerts.includes(alert.id)}
                  onChange={() => handleSelectAlert(alert.id)}
                />
              </div>
              
              <div className="alert-icon" style={{ color: getAlertTypeColor(alert.type) }}>
                {getAlertTypeIcon(alert.type)}
              </div>
              
              <div className="alert-content">
                <div className="alert-header">
                  <h3 className="alert-title">{alert.title}</h3>
                  <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                </div>
                
                <p className="alert-message">{alert.message}</p>
                
                <div className="alert-meta">
                  <span className="alert-shelter">{alert.shelter}</span>
                  {alert.priority && (
                    <span className={`alert-priority ${alert.priority}`}>
                      {alert.priority}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="alert-actions">
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="acknowledge-btn"
                    title="Acknowledge Alert"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="dismiss-btn"
                  title="Dismiss Alert"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsContent; 