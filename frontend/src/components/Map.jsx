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
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is not configured. Please check your environment variables.');
      return;
    }

    // Load Google Maps API using the modern approach
    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google && window.google.maps) {
          console.log('Google Maps API already loaded');
          initializeMap();
          return;
        }

        // Load the API using the modern pattern
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = `
          (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
          ({key: "${apiKey}", v: "weekly"});
        `;
        
        document.head.appendChild(script);
        
        // Wait for Google Maps to load
        const waitForGoogleMaps = () => {
          if (window.google && window.google.maps) {
            console.log('Google Maps API loaded successfully');
            initializeMap();
          } else {
            setTimeout(waitForGoogleMaps, 100);
          }
        };
        
        waitForGoogleMaps();
        
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
      }
    };

    loadGoogleMaps();
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

  const initializeMap = async () => {
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

      // Import the maps library using modern approach
      const { Map } = await window.google.maps.importLibrary("maps");

      // Toronto coordinates
      const toronto = { lat: 43.6532, lng: -79.3832 };
      
      const mapInstance = new Map(mapElement, {
        center: toronto,
        zoom: 11,
        mapId: 'DEMO_MAP_ID', // Optional: for custom styling
      });

      setMap(mapInstance);
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please try refreshing the page.');
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

  const createMarkerContent = useCallback((shelter) => {
    const statusColor = getStatusColor(shelter.predicted_influx);
    
    return `
      <div class="marker-content" style="
        background: white;
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
        color: white;
        background-color: ${statusColor === 'critical' ? '#ff4444' : statusColor === 'warning' ? '#ffaa00' : '#44aa44'};
      ">
        ${statusColor === 'critical' || statusColor === 'warning' ? '!' : '✓'}
      </div>
    `;
  }, [getStatusColor]);

  useEffect(() => {
    if (map && shelters.length > 0) {
      const createMarkers = async () => {
        try {
          // Clear existing markers
          markers.forEach(marker => marker.map = null);
          
          // Import the marker library using modern approach
          const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
          const { InfoWindow } = await window.google.maps.importLibrary("core");
          
          const newMarkers = shelters
            .filter(shelter => shelter.lat && shelter.lng) // Only show shelters with coordinates
            .map(shelter => {
              try {
                const position = {
                  lat: shelter.lat,
                  lng: shelter.lng
                };

                // Create marker content element
                const markerContent = document.createElement('div');
                markerContent.innerHTML = createMarkerContent(shelter);
                const markerElement = markerContent.firstElementChild;

                // Create advanced marker
                const marker = new AdvancedMarkerElement({
                  position: position,
                  map: map,
                  title: shelter.name,
                  content: markerElement
                });

                // Create info window
                const infoWindow = new InfoWindow({
                  content: `
                    <div class="info-window">
                      <h3>${shelter.name}</h3>
                      <p><strong>Address:</strong> ${shelter.address}</p>
                      <p><strong>Predicted Influx:</strong> ${shelter.predicted_influx}</p>
                      <p><strong>Status:</strong> ${getStatusText(shelter.predicted_influx)}</p>
                    </div>
                  `
                });

                // Add click listener
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
      };

      createMarkers();
    }
  }, [map, shelters, markers, createMarkerContent, getStatusText]);

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