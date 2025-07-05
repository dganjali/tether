# TetherAI - Intelligent Shelter Management Platform

TetherAI is a comprehensive shelter management platform that combines machine learning predictions with AI-powered recommendations to optimize resource allocation and improve shelter operations in Toronto.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Detailed Functionality](#detailed-functionality)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Machine Learning Model](#machine-learning-model)
- [Frontend Components](#frontend-components)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

TetherAI provides real-time shelter occupancy predictions and intelligent resource allocation recommendations. The platform uses historical data, weather patterns, and machine learning algorithms to predict shelter capacity needs and generate actionable insights for shelter managers.

### Key Capabilities

- Real-time shelter occupancy predictions
- AI-powered resource allocation recommendations
- Interactive dashboard with analytics
- User authentication and personalized shelter tracking
- Alert system for critical capacity issues
- Weather data integration for predictive modeling

## Features

### Dashboard Analytics
- Real-time shelter statistics and metrics
- Critical alert monitoring
- Utilization rate tracking
- Historical data visualization
- Interactive grid and table views

### AI Recommendations
- Intelligent resource allocation suggestions
- Capacity utilization analysis
- Action item generation
- Severity-based alerting system
- Personalized shelter management

### User Management
- Secure authentication system
- Personalized shelter tracking
- User-specific alerts and notifications
- Role-based access control

### Data Integration
- Historical shelter occupancy data
- Weather data correlation
- Real-time data processing
- Predictive modeling integration

## Detailed Functionality

### Core System Components

#### 1. Authentication System
**Functionality**: Secure user authentication and authorization
- **Registration**: Users can create accounts with email verification
- **Login**: JWT-based authentication with token refresh
- **Session Management**: Persistent login sessions with automatic token renewal
- **Password Security**: Bcrypt hashing with salt rounds
- **Access Control**: Role-based permissions for different user types

#### 2. Dashboard Analytics Engine
**Functionality**: Real-time data processing and visualization
- **Data Aggregation**: Collects shelter data from multiple sources
- **Real-time Updates**: Live data refresh every 30 seconds (configurable)
- **Metric Calculation**: Automatic computation of utilization rates, capacity percentages
- **Trend Analysis**: Historical data comparison and pattern recognition
- **Alert Generation**: Automatic alerts for critical capacity issues

#### 3. Prediction System
**Functionality**: Machine learning-based occupancy forecasting
- **Model Integration**: TensorFlow/Keras neural network for predictions
- **Data Preprocessing**: Historical data cleaning and feature engineering
- **Weather Correlation**: Integration of weather data for improved accuracy
- **Multi-horizon Forecasting**: 7-day, 14-day, and 30-day predictions
- **Confidence Intervals**: Uncertainty quantification for predictions

#### 4. AI Recommendation Engine
**Functionality**: Intelligent resource allocation suggestions
- **Capacity Analysis**: Real-time capacity utilization assessment
- **Resource Optimization**: Staffing and supply recommendations
- **Severity Classification**: Critical, warning, and normal status categorization
- **Action Items**: Specific, actionable recommendations for shelter managers
- **Priority Ranking**: Recommendations sorted by urgency and impact

#### 5. Alert Management System
**Functionality**: Proactive notification and monitoring
- **Threshold Monitoring**: Automatic detection of capacity thresholds
- **Escalation Logic**: Progressive alert levels based on severity
- **Notification Delivery**: Email, in-app, and SMS notifications
- **Alert Resolution**: Tracking and management of alert status
- **Custom Thresholds**: User-configurable alert parameters

### Frontend Functionality

#### 1. Dashboard Interface
**Components**: Main analytics and control center
- **Analytics Cards**: Real-time metrics display with hover effects
- **View Toggle**: Grid and table view switching with smooth transitions
- **Search & Filter**: Advanced filtering by status, capacity, and location
- **Sort Options**: Multiple sorting criteria (name, utilization, capacity)
- **Auto-refresh**: Configurable automatic data refresh
- **Keyboard Shortcuts**: Ctrl+R (refresh), Ctrl+G/T (view toggle), Ctrl+F (search)

#### 2. Shelter Management
**Components**: Individual shelter tracking and management
- **Shelter Cards**: Detailed shelter information with status indicators
- **Utilization Bars**: Visual progress bars with animated fills
- **Status Indicators**: Color-coded status with icons (Critical, Warning, Normal)
- **Add to Favorites**: One-click shelter tracking for users
- **Quick Actions**: Rapid access to shelter-specific functions

#### 3. AI Recommendations Interface
**Components**: Intelligent suggestion display and interaction
- **Recommendation Cards**: Detailed AI suggestions with severity levels
- **Action Items**: Step-by-step implementation guidance
- **Severity Badges**: Visual severity indicators with color coding
- **Interactive Elements**: Clickable recommendations with detailed explanations
- **Feedback System**: User feedback collection for recommendation improvement

#### 4. User Profile Management
**Components**: Personal shelter tracking and preferences
- **My Shelters**: Personalized shelter list with custom notes
- **Alert Preferences**: Customizable notification settings
- **Profile Settings**: User account management and preferences
- **Data Export**: Export functionality for personal shelter data

#### 5. Alert Center
**Components**: Comprehensive alert management
- **Alert Dashboard**: Overview of all active and resolved alerts
- **Alert Details**: Detailed information for each alert
- **Resolution Tracking**: Mark alerts as resolved with notes
- **Alert History**: Historical alert data and trends
- **Filter Options**: Filter alerts by type, severity, and date

### Backend Functionality

#### 1. API Gateway
**Functionality**: Centralized request handling and routing
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Management**: Cross-origin resource sharing configuration
- **Error Handling**: Comprehensive error handling and logging
- **Response Formatting**: Standardized API response format

#### 2. Data Processing Engine
**Functionality**: Real-time data processing and transformation
- **Data Validation**: Input data validation and cleaning
- **Aggregation**: Data aggregation from multiple sources
- **Transformation**: Data format conversion and normalization
- **Caching**: Intelligent caching for improved performance
- **Real-time Updates**: WebSocket connections for live updates

#### 3. Machine Learning Pipeline
**Functionality**: Automated ML model management and inference
- **Model Loading**: Dynamic model loading and versioning
- **Preprocessing**: Real-time data preprocessing for predictions
- **Inference Engine**: Fast prediction generation
- **Model Monitoring**: Performance tracking and model health
- **Auto-retraining**: Automated model retraining with new data

#### 4. Database Management
**Functionality**: Comprehensive data persistence and retrieval
- **CRUD Operations**: Complete create, read, update, delete operations
- **Query Optimization**: Optimized database queries for performance
- **Data Relationships**: Complex data relationships and joins
- **Backup Management**: Automated database backup and recovery
- **Migration System**: Database schema migration management

#### 5. Security Layer
**Functionality**: Comprehensive security implementation
- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Input Sanitization**: SQL injection and XSS prevention
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: Comprehensive security audit trails

### Advanced Features

#### 1. Real-time Analytics
**Functionality**: Live data processing and visualization
- **WebSocket Integration**: Real-time data streaming
- **Live Updates**: Automatic UI updates without page refresh
- **Performance Metrics**: Real-time performance monitoring
- **User Activity Tracking**: Anonymous usage analytics
- **System Health Monitoring**: Application health and status

#### 2. Predictive Analytics
**Functionality**: Advanced forecasting and trend analysis
- **Time Series Analysis**: Historical pattern recognition
- **Seasonal Decomposition**: Seasonal trend identification
- **Anomaly Detection**: Unusual pattern detection
- **Confidence Intervals**: Prediction uncertainty quantification
- **Model Ensemble**: Multiple model combination for accuracy

#### 3. Data Integration
**Functionality**: Multi-source data aggregation
- **API Integration**: External API data fetching
- **Data Synchronization**: Real-time data synchronization
- **Format Conversion**: Multiple data format support
- **Error Recovery**: Robust error handling and recovery
- **Data Quality**: Automated data quality assessment

#### 4. Performance Optimization
**Functionality**: System performance and scalability
- **Caching Strategy**: Multi-level caching implementation
- **Database Optimization**: Query optimization and indexing
- **CDN Integration**: Static asset delivery optimization
- **Load Balancing**: Request distribution and load management
- **Resource Monitoring**: System resource usage tracking

#### 5. User Experience Features
**Functionality**: Enhanced user interaction and accessibility
- **Responsive Design**: Mobile-first responsive layout
- **Accessibility**: WCAG compliance and screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Loading States**: Comprehensive loading and error states
- **Progressive Enhancement**: Graceful degradation for older browsers

### Integration Capabilities

#### 1. External APIs
- **Weather Data**: Integration with weather APIs for correlation
- **Geocoding Services**: Address to coordinate conversion
- **Notification Services**: Email and SMS notification integration
- **Analytics Platforms**: Google Analytics and custom analytics
- **Monitoring Tools**: Application performance monitoring

#### 2. Data Export/Import
- **CSV Export**: Data export in CSV format
- **JSON API**: RESTful API for data access
- **Bulk Operations**: Batch data processing capabilities
- **Data Validation**: Import data validation and cleaning
- **Format Support**: Multiple data format support

#### 3. Third-party Integrations
- **Authentication Providers**: OAuth integration options
- **Payment Processing**: Payment gateway integration
- **Communication Tools**: Slack and email integration
- **Reporting Tools**: Advanced reporting and analytics
- **Backup Services**: Cloud backup and storage integration

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Python** - Machine learning model integration
- **TensorFlow/Keras** - Neural network models
- **Pandas** - Data processing
- **NumPy** - Numerical computations

### Frontend
- **React.js** - User interface library
- **JavaScript (ES6+)** - Modern JavaScript features
- **CSS3** - Advanced styling with animations
- **HTML5** - Semantic markup
- **Context API** - State management
- **Fetch API** - HTTP requests

### DevOps & Deployment
- **Render** - Cloud hosting platform
- **Git** - Version control
- **npm** - Package management
- **Shell scripts** - Build automation

### Data & Analytics
- **CSV/JSON** - Data formats
- **Geocoding APIs** - Location services
- **Weather APIs** - Environmental data
- **Machine Learning Models** - Predictive analytics

## Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Pipeline   │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │   MongoDB       │    │   Data Storage  │
│                 │    │   Database      │    │   (CSV/JSON)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture
- **Frontend**: React components with modern UI/UX
- **Backend**: RESTful API with Express.js
- **Database**: MongoDB with Mongoose ODM
- **ML Pipeline**: Python-based prediction models
- **Deployment**: Render cloud platform

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/tetherai.git
cd tetherai

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Set up Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start development servers
npm run dev
```

## Development Setup

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Install MongoDB locally or use MongoDB Atlas
# Update connection string in backend/.env
```

### Environment Configuration
Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/tetherai
JWT_SECRET=your_jwt_secret_here
PORT=5000
NODE_ENV=development
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## Deployment

### Render Deployment
The application is configured for deployment on Render with the following services:

1. **Web Service** - Main application
2. **Background Worker** - ML model processing
3. **Database** - MongoDB instance

### Build Process
```bash
# Build script execution
./build.sh

# Clear cache if needed
./clear-cache.sh
```

### Environment Variables for Production
```
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
PORT=10000
```

## API Documentation

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
GET /api/auth/verify - Token verification
```

### Shelter Data Endpoints
```
GET /api/predictions - Get shelter predictions
GET /api/shelter-locations - Get shelter locations
POST /api/user-shelters - Add shelter to user list
GET /api/user-shelters - Get user's shelters
```

### AI Recommendations Endpoints
```
GET /api/recommendations - Get AI recommendations
POST /api/alerts - Create new alert
GET /api/alerts - Get user alerts
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

## Machine Learning Model

### Model Architecture
- **Type**: Neural Network (LSTM/GRU)
- **Framework**: TensorFlow/Keras
- **Input Features**: Historical occupancy, weather data, time series
- **Output**: Predicted shelter occupancy

### Model Training
```bash
cd backend/ML-LLM-hybrid-recommendation-system
python modelling.py
```

### Data Preprocessing
```bash
cd backend/ML-LLM-hybrid-recommendation-system/Preprocessing
python preprocess.py
```

### Model Files
- `model.h5` - Trained neural network model
- `recommendation.json` - ML-based recommendations
- `recommendation_llm.json` - LLM-enhanced recommendations

## Frontend Components

### Core Components
- **DashboardTabs** - Main navigation and layout
- **DashboardContent** - Analytics and predictions display
- **RecommendationsContent** - AI recommendations interface
- **YourSheltersContent** - User's tracked shelters
- **AlertsContent** - Alert management system

### UI Components
- **LoadingSpinner** - Multiple loading animation types
- **Toast** - Notification system
- **Map** - Interactive shelter location display
- **Heatmap** - Data visualization component

### Styling
- Modern CSS with glassmorphism effects
- Responsive design for all screen sizes
- Advanced animations and transitions
- Accessibility-compliant interface

## Database Schema

### User Model
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Shelter Model
```javascript
{
  name: String,
  address: String,
  capacity: Number,
  currentOccupancy: Number,
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}
```

### Alert Model
```javascript
{
  userId: ObjectId,
  shelterId: ObjectId,
  type: String,
  severity: String,
  message: String,
  createdAt: Date,
  resolved: Boolean
}
```

### UserShelter Model
```javascript
{
  userId: ObjectId,
  shelterName: String,
  address: String,
  capacity: Number,
  addedAt: Date
}
```

## Environment Variables

### Required Variables
```
MONGODB_URI - MongoDB connection string
JWT_SECRET - Secret key for JWT tokens
NODE_ENV - Environment (development/production)
PORT - Server port number
```

### Optional Variables
```
CORS_ORIGIN - Allowed CORS origins
LOG_LEVEL - Application logging level
API_RATE_LIMIT - Rate limiting configuration
```

## Troubleshooting

### Common Issues

**Frontend Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Backend Connection Issues**
```bash
# Check MongoDB connection
mongo --eval "db.runCommand('ping')"
```

**ML Model Loading Errors**
```bash
# Verify Python dependencies
pip install -r requirements.txt
python -c "import tensorflow as tf; print(tf.__version__)"
```

**Deployment Issues**
```bash
# Clear Render cache
./clear-cache.sh
# Rebuild application
./build.sh
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

### Performance Optimization
- Enable gzip compression
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use ESLint for JavaScript linting
- Follow React best practices
- Maintain consistent code formatting
- Write meaningful commit messages

### Testing
```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

## Changelog

### Version 2.0.0
- Complete UI/UX redesign with modern styling
- Enhanced dashboard with analytics
- Improved AI recommendations system
- Added keyboard shortcuts and QoL features
- Implemented auto-refresh functionality

### Version 1.0.0
- Initial release with basic functionality
- Shelter prediction system
- User authentication
- Basic dashboard interface 
