# Google Maps Heatmap Feature

## Overview
The Google Maps Heatmap feature provides an interactive map visualization of foodbanks with proper heatmap overlay. Foodbanks are plotted relative to a center point with realistic coordinates and data.

## Features

### 🗺️ Interactive Map
- Real Google Maps integration
- Interactive markers for each foodbank
- Click markers to view detailed information
- Toggle heatmap overlay on/off

### 🔥 Heatmap Visualization
- Color-coded heatmap based on predicted influx
- Red: High alert (>80 predicted influx)
- Orange: Medium alert (50-80 predicted influx)
- Green: Low alert (<50 predicted influx)

### 📊 Real-time Data
- Dynamic foodbank data generation
- Realistic coordinates relative to center point
- Capacity and occupancy tracking
- Predicted influx calculations

### ⚙️ Configurable Settings
- Easy center point configuration
- Adjustable search radius
- Customizable alert thresholds
- Map styling options

## Setup Instructions

### 1. Google Maps API Key
Follow the setup guide in `GOOGLE_MAPS_SETUP.md` to get your API key.

### 2. Environment Configuration
Create a `.env` file in the frontend directory:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Configuration
Edit `src/config/mapConfig.js` to customize:
- Center point location
- Search radius
- Alert thresholds
- Map styling

## Usage

### Changing the Center Point
Edit `src/config/mapConfig.js`:
```javascript
// Change to any city
const CENTER_POINT = MAP_CONFIG.CENTER_POINTS.VANCOUVER;

// Or use custom coordinates
const CENTER_POINT = { lat: 45.5017, lng: -73.5673 };
```

### Adjusting Alert Thresholds
```javascript
ALERT_THRESHOLDS: {
  HIGH: 80,    // High alert threshold
  MEDIUM: 50,  // Medium alert threshold
  LOW: 0       // Low alert threshold
}
```

### Modifying Search Radius
```javascript
SEARCH_RADIUS_KM: 15  // Radius in kilometers
```

## Data Structure

Each foodbank object contains:
```javascript
{
  id: number,
  name: string,
  lat: number,
  lng: number,
  predicted_influx: number,
  address: string,
  capacity: number,
  current_occupancy: number,
  phone: string,
  email: string,
  hours: string,
  services: string[],
  status: 'high' | 'medium' | 'low'
}
```

## Components

### GoogleMapsHeatmap.jsx
Main component handling map initialization and interaction.

### foodbankData.js
Utility functions for generating and managing foodbank data.

### mapConfig.js
Configuration settings for map behavior and appearance.

## Troubleshooting

### Map Not Loading
- Check your API key is correctly set
- Ensure billing is enabled on Google Cloud
- Verify all required APIs are enabled

### No Data Displayed
- Check browser console for errors
- Verify the center point coordinates
- Ensure the search radius is appropriate

### Performance Issues
- Reduce the number of foodbanks generated
- Decrease the search radius
- Optimize the heatmap radius and opacity

## Customization

### Adding New Cities
Add to `mapConfig.js`:
```javascript
CENTER_POINTS: {
  YOUR_CITY: { lat: YOUR_LAT, lng: YOUR_LNG },
  // ... existing cities
}
```

### Custom Heatmap Colors
Modify the gradient in `mapConfig.js`:
```javascript
HEATMAP_GRADIENT: [
  'rgba(0, 255, 255, 0)',
  // ... your custom colors
  'rgba(255, 0, 0, 1)'
]
```

### Styling Changes
Edit `GoogleMapsHeatmap.css` for visual customization. 