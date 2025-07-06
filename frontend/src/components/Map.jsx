import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import logo from '../images/LOGO.png';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [isShelterListVisible, setIsShelterListVisible] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchShelterData();
  }, []);

  const fetchShelterData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching shelter data...');
      
      // Fetch both predictions and locations
      const [predictionsResponse, locationsResponse] = await Promise.all([
        fetch('/api/predictions'),
        fetch('/api/shelter-locations')
      ]);
      
      if (!predictionsResponse.ok) {
        throw new Error(`Predictions HTTP error! status: ${predictionsResponse.status}`);
      }
      
      if (!locationsResponse.ok) {
        throw new Error(`Locations HTTP error! status: ${locationsResponse.status}`);
      }
      
      const predictions = await predictionsResponse.json();
      const locations = await locationsResponse.json();
      
      console.log('Predictions:', predictions.length);
      console.log('Locations:', locations.length);
      
      // Combine predictions with locations
      const combinedShelters = predictions.map(prediction => {
        const location = locations.find(loc => loc.name === prediction.name);
        return {
          ...prediction,
          lat: location?.lat ? parseFloat(location.lat) : null,
          lng: location?.lng ? parseFloat(location.lng) : null,
          address: location?.address || 'Address not available',
          city: location?.city || 'Toronto',
          province: location?.province || 'ON'
        };
      });
      
      console.log('Combined shelters:', combinedShelters.length);
      console.log('Shelters with coordinates:', combinedShelters.filter(s => s.lat && s.lng).length);
      
      setShelters(combinedShelters);
    } catch (err) {
      console.error('Error fetching shelter data:', err);
      setError('Failed to load shelter data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = useCallback((influx) => {
    if (influx > 150) return 'Critical';
    if (influx >= 80) return 'Warning';
    return 'Normal';
  }, []);

  const getStatusColor = useCallback((influx) => {
    if (influx > 150) return 'critical';
    if (influx >= 80) return 'warning';
    return 'normal';
  }, []);

  const createCustomIcon = useCallback((influx) => {
    const statusColor = getStatusColor(influx);
    const color = statusColor === 'critical' ? '#ef4444' : statusColor === 'warning' ? '#f59e0b' : '#10b981';
    const symbol = statusColor === 'critical' || statusColor === 'warning' ? '!' : '✓';
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: 12px;
        ">
          ${symbol}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  }, [getStatusColor]);

  const handleShelterClick = (shelter) => {
    setSelectedShelter(shelter);
    
    // Center map on the selected shelter
    if (mapRef.current && shelter.lat && shelter.lng) {
      mapRef.current.setView([shelter.lat, shelter.lng], 15);
    }
  };

  const toggleShelterList = () => {
    setIsShelterListVisible(!isShelterListVisible);
  };

  const sheltersWithCoordinates = shelters.filter(shelter => shelter.lat && shelter.lng);

  if (loading) {
    return (
      <div className="map-page">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Loading Shelter Map</h2>
            <p>Fetching shelter locations and data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page">
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Map</h2>
            <p>{error}</p>
            <button onClick={fetchShelterData} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* Header */}
      <header className="map-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={logo} alt="Logo" className="header-logo" />
            <div className="title-section">
              <h1>Shelter Map</h1>
              <p>Interactive shelter locations and occupancy status</p>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot normal"></span>
                <span>Normal</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot warning"></span>
                <span>Warning</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot critical"></span>
                <span>Critical</span>
              </div>
            </div>
            
            <button onClick={toggleShelterList} className="toggle-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
              {isShelterListVisible ? 'Hide List' : 'Show List'}
            </button>
            
            <Link to="/resource-finder" className="finder-button">
              <span>🔍</span>
              Shelter Finder
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Map Area */}
      <main className="map-main">
        <div className="map-container">
          <MapContainer 
            center={[43.6532, -79.3832]} 
            zoom={11} 
            className="leaflet-map"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {sheltersWithCoordinates.map((shelter, index) => (
              <Marker
                key={index}
                position={[shelter.lat, shelter.lng]}
                icon={createCustomIcon(shelter.predicted_influx)}
              >
                <Popup>
                  <div className="popup-content">
                    <h3>{shelter.name}</h3>
                    <p><strong>Address:</strong> {shelter.address}</p>
                    <p><strong>Predicted Influx:</strong> {shelter.predicted_influx}</p>
                    <p><strong>Status:</strong> {getStatusText(shelter.predicted_influx)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Shelter List Sidebar */}
        {isShelterListVisible && (
          <aside className="shelter-sidebar">
            <div className="sidebar-header">
              <h3>Shelter List</h3>
              <span className="shelter-count">{sheltersWithCoordinates.length} shelters</span>
            </div>
            
            <div className="shelter-list">
              {sheltersWithCoordinates.map((shelter, index) => (
                <div 
                  key={index}
                  className={`shelter-card ${getStatusColor(shelter.predicted_influx)} ${selectedShelter?.name === shelter.name ? 'selected' : ''}`}
                  onClick={() => handleShelterClick(shelter)}
                >
                  <div className="shelter-header">
                    <h4 className="shelter-name">{shelter.name}</h4>
                    <span className={`status-badge ${getStatusColor(shelter.predicted_influx)}`}>
                      {getStatusText(shelter.predicted_influx)}
                    </span>
                  </div>
                  
                  <p className="shelter-address">{shelter.address}</p>
                  
                  <div className="shelter-stats">
                    <div className="stat-item">
                      <span className="stat-label">Predicted Influx</span>
                      <span className="stat-value">{shelter.predicted_influx}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default Map; 