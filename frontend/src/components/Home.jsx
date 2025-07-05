import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Toronto Shelter Analytics & Prediction System</h1>
          <p className="hero-subtitle">
            Real-time monitoring and predictive analytics for Toronto's shelter system
          </p>
          <div className="hero-buttons">
            <Link to="/signin" className="btn btn-primary">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-secondary">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-time Dashboard</h3>
            <p>Monitor current shelter occupancy, trends, and key metrics in real-time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Interactive Heatmap</h3>
            <p>Visualize shelter locations and occupancy levels across Toronto.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔮</div>
            <h3>Predictive Analytics</h3>
            <p>AI-powered forecasts to predict shelter demand and optimize resource allocation.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚨</div>
            <h3>Smart Alerts</h3>
            <p>Get notified about critical situations and capacity issues.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>About the System</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              The Toronto Shelter Analytics & Prediction System is designed to help city officials, 
              social workers, and community organizations better understand and respond to shelter 
              needs across the city.
            </p>
            <p>
              Our advanced machine learning models analyze historical data, weather patterns, 
              and various socio-economic factors to provide accurate predictions about shelter 
              demand, helping ensure that resources are allocated efficiently and no one is 
              left without shelter during critical times.
            </p>
            <p>
              The system provides real-time monitoring capabilities, interactive visualizations, 
              and predictive analytics to support data-driven decision making in Toronto's 
              shelter system.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Real-time Monitoring</p>
            </div>
            <div className="stat-item">
              <h3>AI-Powered</h3>
              <p>Predictive Analytics</p>
            </div>
            <div className="stat-item">
              <h3>City-Wide</h3>
              <p>Coverage</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join our platform to access comprehensive shelter analytics and predictions.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn btn-primary">
            Create Account
          </Link>
          <Link to="/signin" className="btn btn-outline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; 