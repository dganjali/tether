import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import logo from '../../images/LOGO.png';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-logo">
              <img src={logo} alt="Logo" className="home-logo" />
            </div>
            <h1 className="hero-title">
              Toronto Shelter Analytics
              <span className="hero-subtitle"> & Prediction System</span>
            </h1>
            <p className="hero-description">
              Advanced AI-powered analytics for real-time monitoring and predictive insights 
              across Toronto's shelter network. Empowering data-driven decisions to ensure 
              no one is left without shelter.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">80+</span>
                <span className="stat-label">Shelters Monitored</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Real-time Updates</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">AI</span>
                <span className="stat-label">Predictive Analytics</span>
              </div>
            </div>
            <div className="hero-buttons">
              <Link to="/signin" className="btn btn-primary">
                <span className="btn-icon">🔐</span>
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                <span className="btn-icon">📊</span>
                Sign Up
              </Link>
              <Link to="/map" className="btn btn-outline">
                <span className="btn-icon">🗺️</span>
                Map
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="preview-content">
                <div className="preview-card">
                  <div className="preview-stat">
                    <span className="preview-icon">🏠</span>
                    <div>
                      <span className="preview-number">84</span>
                      <span className="preview-label">Shelters</span>
                    </div>
                  </div>
                </div>
                <div className="preview-card critical">
                  <div className="preview-stat">
                    <span className="preview-icon">🔴</span>
                    <div>
                      <span className="preview-number">12</span>
                      <span className="preview-label">Critical</span>
                    </div>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-stat">
                    <span className="preview-icon">📈</span>
                    <div>
                      <span className="preview-number">67</span>
                      <span className="preview-label">Avg Influx</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Comprehensive tools for shelter management and analytics</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span>📊</span>
              </div>
              <h3>Real-time Dashboard</h3>
              <p>Monitor current shelter occupancy, trends, and key metrics with live updates and interactive visualizations.</p>
              <div className="feature-highlights">
                <span>Live Updates</span>
                <span>Interactive Charts</span>
                <span>Key Metrics</span>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>🗺️</span>
              </div>
              <h3>Interactive Map</h3>
              <p>Visualize shelter locations and occupancy levels across Toronto with our advanced mapping system.</p>
              <div className="feature-highlights">
                <span>Geographic View</span>
                <span>Capacity Overlay</span>
                <span>Location Tracking</span>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>🔮</span>
              </div>
              <h3>Predictive Analytics</h3>
              <p>AI-powered forecasts to predict shelter demand and optimize resource allocation effectively.</p>
              <div className="feature-highlights">
                <span>ML Models</span>
                <span>Weather Integration</span>
                <span>Trend Analysis</span>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>🚨</span>
              </div>
              <h3>Smart Alerts</h3>
              <p>Get notified about critical situations and capacity issues with intelligent alerting system.</p>
              <div className="feature-highlights">
                <span>Real-time Alerts</span>
                <span>Custom Thresholds</span>
                <span>Multi-channel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Our System</h2>
              <p>
                The Toronto Shelter Analytics & Prediction System represents a cutting-edge approach 
                to social service management. Our platform combines advanced machine learning algorithms 
                with real-time data processing to provide unprecedented insights into shelter operations.
              </p>
              <p>
                By analyzing historical patterns, weather conditions, and socio-economic factors, 
                our AI models deliver accurate predictions that help city officials, social workers, 
                and community organizations make informed decisions about resource allocation.
              </p>
              <p>
                Our system ensures that no one is left without shelter during critical times by 
                providing early warning systems and predictive capabilities that enable proactive 
                rather than reactive responses to shelter needs.
              </p>
            </div>
            <div className="about-stats">
              <div className="about-stat">
                <div className="stat-circle">
                  <span className="stat-number">24/7</span>
                </div>
                <h3>Real-time Monitoring</h3>
                <p>Continuous surveillance and updates</p>
              </div>
              <div className="about-stat">
                <div className="stat-circle">
                  <span className="stat-number">AI</span>
                </div>
                <h3>Predictive Analytics</h3>
                <p>Machine learning powered insights</p>
              </div>
              <div className="about-stat">
                <div className="stat-circle">
                  <span className="stat-number">100%</span>
                </div>
                <h3>City Coverage</h3>
                <p>Complete Toronto shelter network</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="tech-section">
        <div className="container">
          <div className="section-header">
            <h2>Advanced Technology Stack</h2>
            <p>Built with cutting-edge technologies for maximum reliability and performance</p>
          </div>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-icon">🤖</div>
              <h3>Machine Learning</h3>
              <p>Advanced algorithms for predictive modeling</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">⚡</div>
              <h3>Real-time Processing</h3>
              <p>Instant data updates and live monitoring</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🌐</div>
              <h3>Cloud Infrastructure</h3>
              <p>Scalable and reliable cloud-based system</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Works seamlessly across all devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Shelter Management?</h2>
            <p>Join our platform to access comprehensive shelter analytics and predictions that make a real difference.</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary">
                <span className="btn-icon">🚀</span>
                Start Free Trial
              </Link>
              <Link to="/signin" className="btn btn-outline">
                <span className="btn-icon">🔐</span>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 