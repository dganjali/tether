import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import './Heatmap.css';

const Heatmap = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const mapRef = useRef(null);

  // Center point for Toronto
  const CENTER_POINT = { lat: 43.6532, lng: -79.3832 };

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/heatmap', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setShelters(data.shelters || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shelters.length === 0 || !window.google) return;

    // Check if API key is configured
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_actual_api_key_here') {
      setError('Google Maps API key not configured. Please add your API key to the .env file.');
      return;
    }

    // Initialize Google Maps
    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'visualization']
    });

    loader.load().then(() => {
      const google = window.google;
      
      // Create map with modern styling
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: CENTER_POINT,
        zoom: 12,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#f8fafc' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e2e8f0' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      setMap(mapInstance);
      
      // Create heatmap data
      const heatmapData = shelters.map(shelter => ({
        location: new google.maps.LatLng(shelter.lat, shelter.lng),
        weight: shelter.predicted_influx
      }));
      
      // Create heatmap with red gradient for influx
      const heatmapInstance = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstance,
        radius: 50,
        opacity: 0.8,
        gradient: [
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 193, 7, 0.3)',
          'rgba(255, 152, 0, 0.5)',
          'rgba(255, 87, 34, 0.7)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(211, 47, 47, 0.9)',
          'rgba(198, 40, 40, 1)'
        ]
      });
      
      setHeatmap(heatmapInstance);
      
      // Add markers for each shelter
      shelters.forEach(shelter => {
        const marker = new google.maps.Marker({
          position: { lat: shelter.lat, lng: shelter.lng },
          map: mapInstance,
          title: shelter.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: Math.max(8, shelter.predicted_influx / 10),
            fillColor: getMarkerColor(shelter.predicted_influx),
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        
        // Add click listener
        marker.addListener('click', () => {
          setSelectedShelter(shelter);
          setSidebarOpen(true);
        });
      });
      
    }).catch(error => {
      console.error('Error loading Google Maps:', error);
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
    });
  }, [shelters]);

  const getMarkerColor = (influx) => {
    if (influx > 100) return '#d32f2f'; // Red
    if (influx > 50) return '#f57c00'; // Orange
    if (influx > 20) return '#fbc02d'; // Yellow
    return '#4caf50'; // Green
  };

  const getFilteredShelters = () => {
    switch (activeFilter) {
      case 'high':
        return shelters.filter(s => s.predicted_influx > 100);
      case 'medium':
        return shelters.filter(s => s.predicted_influx > 50 && s.predicted_influx <= 100);
      case 'low':
        return shelters.filter(s => s.predicted_influx <= 50);
      default:
        return shelters;
    }
  };

  const toggleHeatmap = () => {
    if (heatmap) {
      const currentMap = heatmap.getMap();
      heatmap.setMap(currentMap ? null : map);
    }
  };

  if (loading) {
    return (
      <div className="heatmap-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Shelter Heatmap</h2>
        <p>Fetching predictions and initializing map</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-error">
        <div className="error-icon">⚠️</div>
        <h2>Heatmap Loading Error</h2>
        <p>{error}</p>
        <button onClick={fetchHeatmapData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <div className="header-content">
          <h1>Toronto Shelter Heatmap</h1>
          <p>Predicted influx for {shelters.length} shelters</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-toggle-heatmap"
            onClick={toggleHeatmap}
          >
            <span className="btn-icon">🔥</span>
            Toggle Heatmap
          </button>
          <button 
            className="btn-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="btn-icon">☰</span>
          </button>
        </div>
      </div>

      <div className="heatmap-content">
        {/* Map Section */}
        <div className={`map-section ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <div className="map-container">
            <div ref={mapRef} className="google-map" />
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="heatmap-sidebar">
            <div className="sidebar-header">
              <h3>Shelter Analytics</h3>
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All ({shelters.length})
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'high' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('high')}
                >
                  High ({shelters.filter(s => s.predicted_influx > 100).length})
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'medium' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('medium')}
                >
                  Medium ({shelters.filter(s => s.predicted_influx > 50 && s.predicted_influx <= 100).length})
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'low' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('low')}
                >
                  Low ({shelters.filter(s => s.predicted_influx <= 50).length})
                </button>
              </div>
            </div>

            {/* Selected Shelter Details */}
            {selectedShelter ? (
              <div className="selected-shelter-card">
                <div className="shelter-header">
                  <h4>{selectedShelter.name}</h4>
                  <button 
                    className="btn-close"
                    onClick={() => setSelectedShelter(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="shelter-metrics">
                  <div className="metric">
                    <span className="metric-label">Predicted Influx</span>
                    <span className={`metric-value ${selectedShelter.predicted_influx > 100 ? 'high' : selectedShelter.predicted_influx > 50 ? 'medium' : 'low'}`}>
                      {selectedShelter.predicted_influx}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Capacity</span>
                    <span className="metric-value">{selectedShelter.capacity}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Sector</span>
                    <span className="metric-value">{selectedShelter.sector}</span>
                  </div>
                </div>
                <div className="shelter-details">
                  <p><strong>Organization:</strong> {selectedShelter.organization}</p>
                  <p><strong>Address:</strong> {selectedShelter.address}</p>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">📍</div>
                <p>Click on a marker to view shelter details</p>
              </div>
            )}

            {/* Shelter List */}
            <div className="shelter-list">
              <h4>Shelters ({getFilteredShelters().length})</h4>
              <div className="list-container">
                {getFilteredShelters().slice(0, 20).map((shelter, index) => (
                  <div 
                    key={index}
                    className={`shelter-item ${selectedShelter?.name === shelter.name ? 'selected' : ''}`}
                    onClick={() => setSelectedShelter(shelter)}
                  >
                    <div className="shelter-item-header">
                      <span className="shelter-name">{shelter.name}</span>
                      <span className={`shelter-status ${shelter.predicted_influx > 100 ? 'high' : shelter.predicted_influx > 50 ? 'medium' : 'low'}`}>
                        {shelter.predicted_influx}
                      </span>
                    </div>
                    <div className="shelter-item-subtitle">
                      {shelter.organization}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap; 