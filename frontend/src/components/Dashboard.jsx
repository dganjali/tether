import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchShelterData();
  }, []);

  const fetchShelterData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/predictions', {
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

  const filteredShelters = shelters
    .filter(shelter => 
      shelter.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(shelter => {
      if (filterBy === 'high') return shelter.predicted_influx > 150;
      if (filterBy === 'medium') return shelter.predicted_influx >= 80 && shelter.predicted_influx <= 150;
      if (filterBy === 'low') return shelter.predicted_influx < 80;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'influx') return b.predicted_influx - a.predicted_influx;
      return 0;
    });

  const getStatusColor = (influx) => {
    if (influx > 150) return 'high';
    if (influx >= 80) return 'medium';
    return 'low';
  };

  const getStatusText = (influx) => {
    if (influx > 150) return 'High Alert';
    if (influx >= 80) return 'Moderate';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Shelter Monitoring Dashboard</h1>
        <div className="dashboard-stats">
          <div className="stat-item">
            <span className="stat-number">{shelters.length}</span>
            <span className="stat-label">Total Shelters</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{shelters.filter(s => s.predicted_influx > 150).length}</span>
            <span className="stat-label">High Alert</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {Math.round(shelters.reduce((sum, s) => sum + s.predicted_influx, 0) / shelters.length)}
            </span>
            <span className="stat-label">Avg Influx</span>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search shelters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="all">All Shelters</option>
            <option value="high">High Alert (&gt;150)</option>
            <option value="medium">Moderate (80-150)</option>
            <option value="low">Normal (&lt;80)</option>
          </select>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="influx">Sort by Influx</option>
          </select>
        </div>
      </div>

      <div className="shelters-grid">
        {filteredShelters.map((shelter, index) => (
          <div key={index} className={`shelter-card ${getStatusColor(shelter.predicted_influx)}`}>
            <div className="shelter-header">
              <h3>{shelter.name}</h3>
              <span className={`status-badge ${getStatusColor(shelter.predicted_influx)}`}>
                {getStatusText(shelter.predicted_influx)}
              </span>
            </div>
            
            <div className="shelter-details">
              <div className="detail-item">
                <span className="detail-label">Predicted Influx:</span>
                <span className="detail-value">{shelter.predicted_influx}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Capacity Status:</span>
                <span className={`capacity-status ${getStatusColor(shelter.predicted_influx)}`}>
                  {shelter.predicted_influx > 150 ? 'Critical' : 
                   shelter.predicted_influx >= 80 ? 'Moderate' : 'Good'}
                </span>
              </div>
            </div>
            
            <div className="shelter-actions">
              <button className="btn-primary">View Details</button>
              <button className="btn-secondary">Add Location</button>
            </div>
          </div>
        ))}
      </div>

      {filteredShelters.length === 0 && (
        <div className="no-results">
          <h3>No shelters found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 