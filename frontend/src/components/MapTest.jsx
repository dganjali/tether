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

        // Load Google Maps API using modern approach
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
            setStatus('Google Maps API loaded successfully! ✅');
          } else {
            setTimeout(waitForGoogleMaps, 100);
          }
        };
        
        waitForGoogleMaps();

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