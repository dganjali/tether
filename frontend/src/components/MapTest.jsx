import React, { useState, useEffect } from 'react';

const MapTest = () => {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        // Check if API key is available
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError('Google Maps API key not found in environment variables');
          return;
        }

        setStatus('API key found, testing Google Maps...');

        // Test if Google Maps is already loaded
        if (window.google && window.google.maps) {
          setStatus('Google Maps API is already loaded and working! ✅');
          return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setStatus('Google Maps API loaded successfully! ✅');
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps API. Check your API key and internet connection.');
        };
        
        document.head.appendChild(script);

      } catch (err) {
        setError(`Error testing Google Maps: ${err.message}`);
      }
    };

    testGoogleMaps();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Google Maps API Test</h2>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <h3>Environment Variables:</h3>
        <p><strong>GOOGLE_MAPS_API_KEY:</strong> {process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  );
};

export default MapTest; 