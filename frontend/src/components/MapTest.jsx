import React, { useState, useEffect } from 'react';
import './Map.css';

const MapTest = () => {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError('Google Maps API key not found in environment variables');
          return;
        }

        setStatus('API key found, testing Google Maps...');

        if (window.google && window.google.maps) {
          setStatus('Google Maps API is already loaded and working! ✅');
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setError('Failed to load Google Maps API');

        window.initMap = () => setStatus('Google Maps API loaded successfully! ✅');

        document.head.appendChild(script);
      } catch (err) {
        setError(`Error testing Google Maps: ${err.message}`);
      }
    };

    testGoogleMaps();
  }, []);

  return (
    <div className="map-test-container flex flex-column text-center">
      <h2>Google Maps API Test</h2>
      {error ? (
        <p className="text-bold" style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
};

export default MapTest;