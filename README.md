# Toronto Shelter Analytics & Prediction System

A full-stack web application for monitoring Toronto shelter occupancy and predicting future trends using machine learning.

## Features

- **Dashboard**: Real-time shelter occupancy monitoring
- **Actionable Recommendations**: Data-driven precise suggestions to implement in anticipation of an influx
- **Heatmap**: Visual representation of shelter capacity across Toronto
- **Forecast**: 7-day occupancy predictions for individual shelters using TensorFlow
- **Alerts**: System notifications and warnings

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: React with modern CSS
- **ML Model**: TensorFlow/Keras (Python 3.11)
- **Data**: CSV-based shelter occupancy data

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python 3.11
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hack404
   ```

2. **Set up Python environment**
   ```bash
   # Create virtual environment
   python3.11 -m venv venv
   
   # Activate virtual environment
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Set up Backend**
   ```bash
   cd backend
   npm install
   ```

4. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on http://localhost:3001

2. **Start the Frontend**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

3. **Access the Application**
   Open your browser and navigate to http://localhost:3000

## API Endpoints

- `GET /api/shelters` - Get list of available shelters
- `GET /api/forecast?shelter=<shelter_name>&days=7` - Get 7-day forecast for a shelter
- `GET /api/predictions` - Get current predictions for all shelters

## ML Model

The system uses a TensorFlow model (`best_model.h5`) trained on historical shelter occupancy data to predict future occupancy levels. The model:

- Takes 30 days of historical data as input
- Outputs occupancy predictions for the next 7 days
- Supports all shelters in the Toronto shelter system

## Project Structure

```
hack404/
├── backend/           # Node.js Express server
├── frontend/          # React application
├── model/            # Python ML scripts
├── data/             # CSV data and predictions
├── venv/             # Python virtual environment
├── best_model.h5     # Trained TensorFlow model
└── requirements.txt  # Python dependencies
```

## Usage

1. **Dashboard**: View current shelter statistics and trends
2. **Heatmap**: Visualize shelter capacity across different areas
3. **Forecast**: 
   - Select a shelter from the dropdown
   - Click "Get 7-Day Forecast" to see predictions
   - View detailed occupancy forecasts for each day
4. **Alerts**: Monitor system notifications and warnings

## Development

- The backend uses caching to improve performance (5 minutes for predictions, 1 hour for shelters list)
- The frontend is built with modern React hooks and functional components
- The ML model is optimized for Python 3.11 compatibility

## Troubleshooting

- **Python Import Errors**: Ensure you're using Python 3.11 and the virtual environment is activated
- **Model Loading Issues**: Check that `best_model.h5` is in the root directory
- **API Connection Errors**: Verify both backend (port 3001) and frontend (port 3000) are running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 
