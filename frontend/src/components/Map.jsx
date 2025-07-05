import React, { useState, useEffect, useCallback } from 'react';
import './Map.css';

const Map = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Check if Google Maps API key is available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is not configured. Please check your environment variables.');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setError('Failed to load Google Maps. Please check your internet connection and API key.');
    };
    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts before loading
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

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
        fetch('http://localhost:1000/api/predictions'),
        fetch('http://localhost:1000/api/shelter-locations')
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
          lat: location?.lat || null,
          lng: location?.lng || null,
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

  const initializeMap = () => {
    try {
      // Check if Google Maps is available
      if (!window.google || !window.google.maps) {
        setError('Google Maps API is not available. Please refresh the page.');
        return;
      }

      // Check if map container exists
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        setError('Map container not found.');
        return;
      }

      // Toronto coordinates
      const toronto = { lat: 43.6532, lng: -79.3832 };
      
      const mapInstance = new window.google.maps.Map(mapElement, {
        zoom: 11,
        center: toronto,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please try refreshing the page.');
    }
  };

  const getMarkerIcon = useCallback((influx) => {
    if (influx > 150) return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="#ff4444" stroke="#fff" stroke-width="2"/>
        <text x="15" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text>
      </svg>
    `);
    if (influx >= 80) return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="#ffaa00" stroke="#fff" stroke-width="2"/>
        <text x="15" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text>
      </svg>
    `);
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="#44aa44" stroke="#fff" stroke-width="2"/>
        <text x="15" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">✓</text>
      </svg>
    `);
  }, []);

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

  useEffect(() => {
    if (map && shelters.length > 0) {
      try {
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        
        const newMarkers = shelters
          .filter(shelter => shelter.lat && shelter.lng) // Only show shelters with coordinates
          .map(shelter => {
            try {
              const position = {
                lat: shelter.lat,
                lng: shelter.lng
              };

              const marker = new window.google.maps.Marker({
                position: position,
                map: map,
                title: shelter.name,
                icon: {
                  url: getMarkerIcon(shelter.predicted_influx),
                  scaledSize: new window.google.maps.Size(30, 30)
                }
              });

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div class="info-window">
                    <h3>${shelter.name}</h3>
                    <p><strong>Address:</strong> ${shelter.address}</p>
                    <p><strong>Predicted Influx:</strong> ${shelter.predicted_influx}</p>
                    <p><strong>Status:</strong> ${getStatusText(shelter.predicted_influx)}</p>
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
              });

              return marker;
            } catch (error) {
              console.error(`Error creating marker for ${shelter.name}:`, error);
              return null;
            }
          })
          .filter(marker => marker !== null); // Remove any failed markers

        setMarkers(newMarkers);
        console.log(`Successfully created ${newMarkers.length} markers`);
      } catch (error) {
        console.error('Error creating markers:', error);
        setError('Failed to create map markers. Please try refreshing the page.');
      }
    }
  }, [map, shelters, markers, getMarkerIcon, getStatusText]);

  const sheltersWithCoordinates = shelters.filter(shelter => shelter.lat && shelter.lng);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Map...</h2>
          <p>Fetching shelter locations</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Map</h2>
          <p>{error}</p>
          <button onClick={fetchShelterData} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="header-content">
          <h1>🗺️ Toronto Shelter Map</h1>
          <p>Interactive map showing all shelter locations and their current status</p>
        </div>
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-color normal"></span>
            <span>Normal (&lt;80)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color warning"></span>
            <span>Warning (80-150)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color critical"></span>
            <span>Critical (&gt;150)</span>
          </div>
        </div>
      </div>
      
      <div className="map-container">
        <div id="map" className="google-map"></div>
        
        <div className="map-sidebar">
          <div className="sidebar-header">
            <h3>🏠 Shelter List</h3>
            <span className="shelter-count">
              {sheltersWithCoordinates.length} of {shelters.length} shelters
            </span>
          </div>
          
          <div className="shelter-list">
            {sheltersWithCoordinates.length > 0 ? (
              sheltersWithCoordinates.map((shelter, index) => (
                <div key={index} className={`shelter-item ${getStatusColor(shelter.predicted_influx)}`}>
                  <div className="shelter-info">
                    <h4>{shelter.name}</h4>
                    <p className="shelter-address">{shelter.address}</p>
                    <p className="shelter-status">
                      <span className={`status-indicator ${getStatusColor(shelter.predicted_influx)}`}>
                        {getStatusText(shelter.predicted_influx)}
                      </span>
                      <span className="influx-value">Influx: {shelter.predicted_influx}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                <p>No shelters with coordinates found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map; 