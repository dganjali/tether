import React, { useState } from 'react';
import './ResourceFinder.css';

const ResourceFinder = () => {
  const [location, setLocation] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const availableServices = {
    'showers': { label: 'Showers & Hygiene', icon: '🚿' },
    'meals': { label: 'Meals & Food', icon: '🍽️' },
    'mental_health': { label: 'Mental Health Services', icon: '🧠' },
    'medical': { label: 'Medical Care', icon: '🏥' },
    'laundry': { label: 'Laundry Services', icon: '👕' },
    'wifi': { label: 'WiFi & Internet', icon: '📶' },
    'shelter': { label: 'Emergency Shelter', icon: '🏠' },
    'clothing': { label: 'Clothing & Supplies', icon: '👔' },
    'counseling': { label: 'Counseling Services', icon: '💬' },
    'job_assistance': { label: 'Job Assistance', icon: '💼' },
    'legal_aid': { label: 'Legal Aid', icon: '⚖️' },
    'substance_abuse': { label: 'Substance Abuse Support', icon: '🆘' }
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }
    
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/find-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: location.trim(),
          selectedServices,
          useLLM: false,
          enhanceScraping: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
      } else {
        setError(data.error || 'Failed to find resources');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Distance unknown';
    return `${distance} km away`;
  };

  const formatServices = (services) => {
    if (!services || services.length === 0) return 'Services not specified';
    return services.map(service => availableServices[service]?.label || service).join(', ');
  };

  return (
    <div className="resource-finder">
      <div className="resource-finder-container">
        <header className="resource-finder-header">
          <h1>Shelter Finder</h1>
          <p>Find nearby shelters and services based on your location and needs</p>
        </header>

        <form onSubmit={handleSubmit} className="resource-finder-form">
          <div className="form-group">
            <label htmlFor="location">📍 Location</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your address, city, or postal code"
              className="location-input"
            />
          </div>

          <div className="form-group">
            <label>🛠️ Services Needed</label>
            <div className="services-grid">
              {Object.entries(availableServices).map(([key, service]) => (
                <label key={key} className="service-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(key)}
                    onChange={() => handleServiceToggle(key)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="service-icon">{service.icon}</span>
                  <span className="service-label">{service.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? '🔍 Searching...' : '🔍 Find Shelters'}
          </button>
        </form>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Searching for shelters and services...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <h2>Found {results.length} shelter{results.length !== 1 ? 's' : ''}</h2>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <h3 className="result-title">{result.name}</h3>
                    <div className="result-score">
                      <span className="score-label">Match</span>
                      <span className="score-value">{Math.round(result.match_score * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="result-details">
                    {result.address && (
                      <div className="result-info">
                        <span className="info-label">📍 Address:</span>
                        <span className="info-value">{result.address}</span>
                      </div>
                    )}
                    
                    {result.phone && (
                      <div className="result-info">
                        <span className="info-label">📞 Phone:</span>
                        <span className="info-value">{result.phone}</span>
                      </div>
                    )}
                    
                    {result.hours && (
                      <div className="result-info">
                        <span className="info-label">🕒 Hours:</span>
                        <span className="info-value">{result.hours}</span>
                      </div>
                    )}
                    
                    <div className="result-info">
                      <span className="info-label">🛠️ Services:</span>
                      <span className="info-value">{formatServices(result.matching_services)}</span>
                    </div>
                    
                    <div className="result-info">
                      <span className="info-label">📏 Distance:</span>
                      <span className="info-value">{formatDistance(result.distance_km)}</span>
                    </div>
                  </div>
                  
                  {result.snippet && (
                    <p className="result-description">{result.snippet}</p>
                  )}
                  
                  {result.url && (
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="result-link"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !isLoading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>Ready to Find Shelters</h3>
            <p>Enter your location and select the services you need to find nearby shelters and resources.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceFinder; 