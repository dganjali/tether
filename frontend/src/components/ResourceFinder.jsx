import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import './ResourceFinder.css';
import logo from '../images/LOGO.png';

const ResourceFinder = () => {
  const [location, setLocation] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [enhanceScraping, setEnhanceScraping] = useState(true);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  const fetchAvailableServices = async () => {
    try {
      const response = await fetch('/api/available-services');
      if (response.ok) {
        const data = await response.json();
        setAvailableServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching available services:', error);
    }
  };

  const handleServiceToggle = (serviceKey) => {
    setSelectedServices(prev => 
      prev.includes(serviceKey)
        ? prev.filter(s => s !== serviceKey)
        : [...prev, serviceKey]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      showError('Please enter a location');
      return;
    }
    
    if (selectedServices.length === 0) {
      showError('Please select at least one service');
      return;
    }

    setLoading(true);
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
          useLLM,
          enhanceScraping
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResults(data.results);
        if (data.results.length > 0) {
          showSuccess(`Found ${data.results.length} nearby resources!`);
        } else {
          showError('No resources found for your location and selected services');
        }
      } else {
        showError(data.error || 'Failed to find resources');
      }
    } catch (error) {
      console.error('Error finding resources:', error);
      showError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const getServiceIcon = (service) => {
    const icons = {
      'showers': '🚿',
      'meals': '🍽️',
      'mental_health': '🧠',
      'medical': '🏥',
      'laundry': '👕',
      'wifi': '📶'
    };
    return icons[service] || '📍';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  };

  return (
    <div className="resource-finder-page">
      {/* Header */}
      <div className="resource-header">
        <div className="header-left">
          <button onClick={handleBackClick} className="back-button">
            ← Back
          </button>
          <div className="header-content">
            <div className="logo-container">
              <img src={logo} alt="Logo" className="header-logo" />
            </div>
            <div className="title-container">
              <h1>Resource Finder</h1>
              <p>Find nearby homeless shelters and services based on your location and needs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="resource-main">
        {/* Form Section */}
        <div className="form-section">
          <div className="form-card">
            <h2>Find Resources</h2>
            <p>Enter your location and select the services you need</p>

            <form onSubmit={handleSubmit} className="resource-form">
              <div className="form-group">
                <label htmlFor="location">
                  <span className="label-icon">📍</span>
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your address, city, or postal code"
                  required
                  disabled={loading}
                  className="location-input"
                />
                <div className="input-hint">
                  We'll find resources near this location
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-icon">🛠️</span>
                  Services Needed
                  <span className="services-count">
                    {selectedServices.length} selected
                  </span>
                </label>
                <div className="services-grid">
                  {Object.entries(availableServices).map(([key, name]) => (
                    <div
                      key={key}
                      className={`service-option ${selectedServices.includes(key) ? 'selected' : ''}`}
                      onClick={() => handleServiceToggle(key)}
                    >
                      <div className="service-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(key)}
                          onChange={() => handleServiceToggle(key)}
                          disabled={loading}
                        />
                      </div>
                      <span className="service-icon">{getServiceIcon(key)}</span>
                      <span className="service-name">{name}</span>
                    </div>
                  ))}
                </div>
                {selectedServices.length === 0 && (
                  <div className="form-hint">
                    Please select at least one service you need
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <span className="label-icon">⚙️</span>
                  Advanced Options
                </label>
                <div className="advanced-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useLLM}
                      onChange={(e) => setUseLLM(e.target.checked)}
                      disabled={loading}
                    />
                    <div className="checkbox-content">
                      <span className="checkbox-title">Use AI Analysis</span>
                      <span className="checkbox-description">Get AI-powered insights and recommendations</span>
                    </div>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={enhanceScraping}
                      onChange={(e) => setEnhanceScraping(e.target.checked)}
                      disabled={loading}
                    />
                    <div className="checkbox-content">
                      <span className="checkbox-title">Enhanced Data Collection</span>
                      <span className="checkbox-description">Gather detailed information from service websites</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="search-button"
                  disabled={loading || !location.trim() || selectedServices.length === 0}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Searching for resources...</span>
                    </>
                  ) : (
                    <>
                      <span className="button-icon">🔍</span>
                      <span>Find Resources</span>
                    </>
                  )}
                </button>
                
                {!location.trim() && (
                  <div className="form-error">Please enter a location</div>
                )}
                
                {location.trim() && selectedServices.length === 0 && (
                  <div className="form-error">Please select at least one service</div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>Found {results.length} Resources</h2>
              <p>Sorted by relevance and distance</p>
            </div>

            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <h3 className="result-title">{result.name}</h3>
                    <div className={`match-score ${getMatchScoreColor(result.match_score)}`}>
                      {Math.round(result.match_score * 100)}% Match
                    </div>
                  </div>

                  <div className="result-services">
                    {result.matching_services.map((service, idx) => (
                      <span key={idx} className="service-tag">
                        {getServiceIcon(service)} {availableServices[service] || service}
                      </span>
                    ))}
                  </div>

                  {result.address && (
                    <div className="result-info">
                      <strong>Address:</strong> {result.address}
                    </div>
                  )}

                  {result.phone && (
                    <div className="result-info">
                      <strong>Phone:</strong> {result.phone}
                    </div>
                  )}

                  {result.hours && (
                    <div className="result-info">
                      <strong>Hours:</strong> {result.hours}
                    </div>
                  )}

                  {result.distance_km && (
                    <div className="result-info">
                      <strong>Distance:</strong> {result.distance_km.toFixed(1)} km
                    </div>
                  )}

                  <div className="result-snippet">
                    {result.snippet}
                  </div>

                  {result.llm_summary && (
                    <div className="llm-summary">
                      <strong>AI Analysis:</strong> {result.llm_summary}
                    </div>
                  )}

                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="visit-link"
                  >
                    Visit Website →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <LoadingSpinner size="large" text="Searching for resources..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceFinder; 