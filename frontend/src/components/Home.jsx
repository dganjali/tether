import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import logo from '../images/LOGO.png';

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
                View Map
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

      {/* Main Content - Flowing Design */}
      <div className="main-content">
        <div className="container">
          {/* System Overview */}
          <div className="content-section">
            <div className="section-intro">
              <h2>Comprehensive Shelter Management Platform</h2>
              <p className="section-description">
                Our advanced system combines real-time monitoring, predictive analytics, and intelligent 
                resource management to create a comprehensive solution for Toronto's shelter network. 
                Built with cutting-edge technology, we provide unprecedented insights that enable 
                proactive rather than reactive responses to shelter needs.
              </p>
            </div>

            {/* Key Features Grid */}
            <div className="features-showcase">
              <div className="feature-item">
                <div className="feature-header">
                  <div className="feature-icon">📊</div>
                  <h3>Real-time Dashboard</h3>
                </div>
                <p>
                  Monitor current shelter occupancy, trends, and key metrics with live updates and 
                  interactive visualizations. Our dashboard provides instant access to critical 
                  information, enabling quick decision-making and resource allocation.
                </p>
                <div className="feature-details">
                  <span>Live Updates</span>
                  <span>Interactive Charts</span>
                  <span>Key Metrics</span>
                  <span>Custom Alerts</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-header">
                  <div className="feature-icon">🗺️</div>
                  <h3>Interactive Map</h3>
                </div>
                <p>
                  Visualize shelter locations and occupancy levels across Toronto with our advanced 
                  mapping system. Geographic data integration provides spatial context for better 
                  understanding of shelter distribution and capacity management.
                </p>
                <div className="feature-details">
                  <span>Geographic View</span>
                  <span>Capacity Overlay</span>
                  <span>Location Tracking</span>
                  <span>Route Optimization</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-header">
                  <div className="feature-icon">🔮</div>
                  <h3>Predictive Analytics</h3>
                </div>
                <p>
                  AI-powered forecasts predict shelter demand and optimize resource allocation effectively. 
                  Our machine learning models analyze historical patterns, weather conditions, and 
                  socio-economic factors to deliver accurate predictions.
                </p>
                <div className="feature-details">
                  <span>ML Models</span>
                  <span>Weather Integration</span>
                  <span>Trend Analysis</span>
                  <span>Demand Forecasting</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-header">
                  <div className="feature-icon">🚨</div>
                  <h3>Smart Alerts</h3>
                </div>
                <p>
                  Get notified about critical situations and capacity issues with intelligent alerting 
                  system. Customizable thresholds and multi-channel notifications ensure you never miss 
                  important updates.
                </p>
                <div className="feature-details">
                  <span>Real-time Alerts</span>
                  <span>Custom Thresholds</span>
                  <span>Multi-channel</span>
                  <span>Escalation Rules</span>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div className="tech-overview">
              <h3>Advanced Technology Stack</h3>
              <p>
                Built with cutting-edge technologies for maximum reliability and performance. 
                Our platform leverages modern cloud infrastructure, real-time processing capabilities, 
                and responsive design principles.
              </p>
              <div className="tech-grid">
                <div className="tech-item">
                  <div className="tech-icon">🤖</div>
                  <h4>Machine Learning</h4>
                  <p>Advanced algorithms for predictive modeling</p>
                </div>
                <div className="tech-item">
                  <div className="tech-icon">⚡</div>
                  <h4>Real-time Processing</h4>
                  <p>Instant data updates and live monitoring</p>
                </div>
                <div className="tech-item">
                  <div className="tech-icon">🌐</div>
                  <h4>Cloud Infrastructure</h4>
                  <p>Scalable and reliable cloud-based system</p>
                </div>
                <div className="tech-item">
                  <div className="tech-icon">📱</div>
                  <h4>Responsive Design</h4>
                  <p>Works seamlessly across all devices</p>
                </div>
              </div>
            </div>

            {/* Impact Section */}
            <div className="impact-section">
              <h3>Making a Real Difference</h3>
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

            {/* Stats Section */}
            <div className="stats-showcase">
              <div className="stat-item">
                <div className="stat-circle">
                  <span className="stat-number">24/7</span>
                </div>
                <h4>Real-time Monitoring</h4>
                <p>Continuous surveillance and updates</p>
              </div>
              <div className="stat-item">
                <div className="stat-circle">
                  <span className="stat-number">AI</span>
                </div>
                <h4>Predictive Analytics</h4>
                <p>Machine learning powered insights</p>
              </div>
              <div className="stat-item">
                <div className="stat-circle">
                  <span className="stat-number">100%</span>
                </div>
                <h4>City Coverage</h4>
                <p>Complete Toronto shelter network</p>
              </div>
              <div className="stat-item">
                <div className="stat-circle">
                  <span className="stat-number">99.9%</span>
                </div>
                <h4>Uptime</h4>
                <p>Reliable cloud infrastructure</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="cta-section">
              <h3>Ready to Transform Shelter Management?</h3>
              <p>
                Join our platform to access comprehensive shelter analytics and predictions that make 
                a real difference in the lives of those who need shelter most.
              </p>
              <div className="cta-buttons">
                <Link to="/signup" className="btn btn-primary">
                  <span className="btn-icon">🚀</span>
                  Get Started
                </Link>
                <Link to="/signin" className="btn btn-outline">
                  <span className="btn-icon">🔐</span>
                  Sign In
                </Link>
                <Link to="/map" className="btn btn-secondary">
                  <span className="btn-icon">🗺️</span>
                  View Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 