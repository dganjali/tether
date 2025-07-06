import React, { useState, useEffect } from 'react';
import './Map.css';

const Map = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);

  useEffect(() => {
    // Simulate loading map data
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock shelter data - in a real app, this would come from an API
        const mockShelters = [
          {
            id: 1,
            name: 'Downtown Emergency Shelter',
            address: '123 Main St, Toronto, ON M5V 2H1',
            coordinates: { lat: 43.6532, lng: -79.3832 },
            services: ['shelter', 'meals', 'showers'],
            capacity: 150,
            occupancy: 120,
            phone: '(416) 555-0123',
            hours: '24/7'
          },
          {
            id: 2,
            name: 'Harbourfront Community Center',
            address: '456 Queen St W, Toronto, ON M5V 2A9',
            coordinates: { lat: 43.6487, lng: -79.3774 },
            services: ['meals', 'medical', 'counseling'],
            capacity: 80,
            occupancy: 65,
            phone: '(416) 555-0456',
            hours: '7:00 AM - 10:00 PM'
          },
          {
            id: 3,
            name: 'North End Support Services',
            address: '789 Yonge St, Toronto, ON M4W 2G8',
            coordinates: { lat: 43.6702, lng: -79.3868 },
            services: ['shelter', 'laundry', 'wifi'],
            capacity: 100,
            occupancy: 85,
            phone: '(416) 555-0789',
            hours: '6:00 PM - 8:00 AM'
          },
          {
            id: 4,
            name: 'West End Resource Center',
            address: '321 Bloor St W, Toronto, ON M5S 1W1',
            coordinates: { lat: 43.6677, lng: -79.3948 },
            services: ['meals', 'showers', 'mental_health'],
            capacity: 60,
            occupancy: 45,
            phone: '(416) 555-0321',
            hours: '8:00 AM - 8:00 PM'
          },
          {
            id: 5,
            name: 'East Side Emergency Services',
            address: '654 Danforth Ave, Toronto, ON M4K 1L9',
            coordinates: { lat: 43.6769, lng: -79.3505 },
            services: ['shelter', 'medical', 'clothing'],
            capacity: 120,
            occupancy: 110,
            phone: '(416) 555-0654',
            hours: '24/7'
          }
        ];
        
        setShelters(mockShelters);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load map data');
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  const handleShelterClick = (shelter) => {
    setSelectedShelter(shelter);
  };

  const closeShelterDetails = () => {
    setSelectedShelter(null);
  };

  const getOccupancyColor = (occupancy, capacity) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 90) return '#dc2626'; // Red
    if (percentage >= 75) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const getOccupancyText = (occupancy, capacity) => {
    const percentage = Math.round((occupancy / capacity) * 100);
    if (percentage >= 90) return 'Full';
    if (percentage >= 75) return 'Busy';
    return 'Available';
  };

  const formatServices = (services) => {
    const serviceLabels = {
      'shelter': 'Shelter',
      'meals': 'Meals',
      'showers': 'Showers',
      'medical': 'Medical',
      'counseling': 'Counseling',
      'laundry': 'Laundry',
      'wifi': 'WiFi',
      'mental_health': 'Mental Health',
      'clothing': 'Clothing'
    };
    
    return services.map(service => serviceLabels[service] || service).join(', ');
  };

  if (isLoading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Shelter Map</h2>
          <p>Finding nearby shelters and services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <div className="map-error">
          <div className="error-icon">⚠️</div>
          <h2>Map Unavailable</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <header className="map-header">
        <h1>Interactive Shelter Map</h1>
        <p>Explore shelter locations and availability</p>
      </header>
      <div className="map-content">
        <div className="map-sidebar">
          <h2>Nearby Shelters</h2>
          <ul className="shelter-list">
            {shelters.map((shelter) => (
              <li 
                key={shelter.id}
                className={`shelter-item ${selectedShelter?.id === shelter.id ? 'selected' : ''}`}
                onClick={() => handleShelterClick(shelter)}
                role="button"
                aria-haspopup="true"
                aria-expanded={selectedShelter?.id === shelter.id}
              >
                <div className="shelter-info">
                  <h3 className="shelter-name">{shelter.name}</h3>
                  <div 
                    className="occupancy-badge"
                    style={{ backgroundColor: getOccupancyColor(shelter.occupancy, shelter.capacity) }}
                    aria-label={`Occupancy: ${shelter.occupancy} of ${shelter.capacity} beds`}
                  >
                    {getOccupancyText(shelter.occupancy, shelter.capacity)}
                  </div>
                </div>
                
                <p className="shelter-address">{shelter.address}</p>
                
                <div className="shelter-services">
                  <span className="services-label">Services:</span>
                  <span className="services-list">{formatServices(shelter.services)}</span>
                </div>
                
                <div className="shelter-occupancy">
                  <span className="occupancy-text">
                    {shelter.occupancy}/{shelter.capacity} beds
                  </span>
                  <div className="occupancy-bar" aria-hidden="true">
                    <div 
                      className="occupancy-fill"
                      style={{ 
                        width: `${(shelter.occupancy / shelter.capacity) * 100}%`,
                        backgroundColor: getOccupancyColor(shelter.occupancy, shelter.capacity)
                      }}
                    ></div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="map-view">
          <div className="map-placeholder" aria-hidden="true">
            <div className="map-icon">🗺️</div>
            <h3>Interactive Map</h3>
            <p>Select a shelter from the list to view details</p>
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
                <span>Busy</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#dc2626' }}></div>
                <span>Full</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedShelter && (
        <div className="shelter-details-overlay">
          <div className="shelter-details-modal">
            <div className="modal-header">
              <h2>{selectedShelter.name}</h2>
              <button 
                className="close-button"
                onClick={closeShelterDetails}
                aria-label="Close shelter details"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-section">
                <h3>Location</h3>
                <p>{selectedShelter.address}</p>
              </div>
              
              <div className="detail-section">
                <h3>Contact</h3>
                <p>Phone: {selectedShelter.phone}</p>
                <p>Hours: {selectedShelter.hours}</p>
              </div>
              
              <div className="detail-section">
                <h3>Services</h3>
                <p>{formatServices(selectedShelter.services)}</p>
              </div>
              
              <div className="detail-section">
                <h3>Availability</h3>
                <div className="availability-info">
                  <div className="availability-status">
                    <span className="status-label">Status:</span>
                    <span 
                      className="status-value"
                      style={{ color: getOccupancyColor(selectedShelter.occupancy, selectedShelter.capacity) }}
                    >
                      {getOccupancyText(selectedShelter.occupancy, selectedShelter.capacity)}
                    </span>
                  </div>
                  <div className="availability-beds">
                    <span className="beds-label">Beds:</span>
                    <span className="beds-value">
                      {selectedShelter.occupancy} of {selectedShelter.capacity} occupied
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="action-button primary">
                Get Directions
              </button>
              <button className="action-button secondary">
                Call Shelter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;