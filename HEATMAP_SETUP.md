# Toronto Shelter Heatmap Setup Guide

This guide will help you set up a complete heatmap showing predicted influx for all Toronto shelters using Google Maps.

## Prerequisites

1. **Google Maps API Key** - You need an API key with these services enabled:
   - Maps JavaScript API
   - Geocoding API
   - Places API

2. **Python Environment** - Make sure your virtual environment is activated

## Step 1: Set Up Your Google Maps API Key

### For Backend (Geocoding)
Set your API key as an environment variable:
```bash
export GOOGLE_MAPS_API_KEY='your_actual_api_key_here'
```

### For Frontend (Maps Display)
Create a `.env` file in the `frontend` directory:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## Step 2: Geocode All Shelter Addresses

Run the geocoding script to convert all shelter addresses to latitude/longitude:

```bash
cd model
source ../venv/bin/activate
python geocode_shelters.py
```

This will:
- Read all unique shelter addresses from your CSV
- Use Google's Geocoding API to get lat/lng coordinates
- Save results to `data/shelter_geocodes.json`
- Skip already geocoded addresses (for efficiency)

## Step 3: Test the Heatmap Data Generation

Generate heatmap data for all shelters:

```bash
cd model
source ../venv/bin/activate
python predict_heatmap.py heatmap
```

This will:
- Load your trained model
- Generate predictions for all shelters
- Combine with geocoded data
- Output JSON with lat/lng and predicted influx

## Step 4: Start the Backend Server

```bash
cd backend
npm start
```

The server will be available at `http://localhost:3001`

## Step 5: Start the Frontend

```bash
cd frontend
npm start
```

The app will be available at `http://localhost:3000`

## Step 6: View the Heatmap

1. Navigate to your app at `http://localhost:3000`
2. Click on the "Heat Map" tab in the sidebar
3. You should see a Google Map with:
   - Heatmap overlay showing predicted influx intensity
   - Individual markers for each shelter
   - Sidebar with shelter details and filtering options

## API Endpoints

### Get Heatmap Data
```
GET http://localhost:3001/api/heatmap
```

Optional query parameter for specific date:
```
GET http://localhost:3001/api/heatmap?date=2025-07-06
```

### Response Format
```json
{
  "shelters": [
    {
      "name": "Shelter Name",
      "lat": 43.6532,
      "lng": -79.3832,
      "predicted_influx": 120,
      "address": "100 Street Name, Toronto, ON",
      "organization": "Organization Name",
      "sector": "Women",
      "capacity": 50
    }
  ],
  "generated_at": "2025-07-05T15:30:00",
  "target_date": "2025-07-06",
  "total_shelters": 85,
  "successful_predictions": 80,
  "failed_predictions": 5
}
```

## Troubleshooting

### "Google Maps API key not configured"
- Make sure you have a `.env` file in the `frontend` directory
- Ensure the API key is correct and has the right permissions
- Restart your frontend server after adding the `.env` file

### "No geocoded data found"
- Run the geocoding script first: `python geocode_shelters.py`
- Check that `data/shelter_geocodes.json` was created

### "Failed to load model"
- Ensure your `model.h5` file exists in the root directory
- Check that TensorFlow is installed in your virtual environment

### Geocoding Errors
- Some addresses might not geocode properly
- Check the console output for failed geocoding attempts
- You can manually add coordinates to `shelter_geocodes.json` if needed

## Features

### Heatmap Visualization
- **Red gradient**: Shows areas of high predicted influx
- **Yellow/Orange**: Medium influx areas
- **Green**: Low influx areas

### Interactive Elements
- **Click markers**: View detailed shelter information
- **Filter tabs**: View shelters by influx level (High/Medium/Low)
- **Toggle heatmap**: Show/hide the heatmap overlay
- **Collapsible sidebar**: Maximize map view

### Data Display
- Predicted influx for each shelter
- Shelter capacity and current status
- Organization and sector information
- Full address details

## Performance Notes

- Geocoding is done once and cached
- Predictions are generated on-demand
- The heatmap uses Google Maps Visualization library for smooth performance
- Large numbers of shelters (>100) may take a few seconds to load

## Next Steps

- Add date selection for different prediction dates
- Implement real-time updates
- Add more filtering options (by sector, organization, etc.)
- Export heatmap data to CSV/Excel
- Add weather data integration for more accurate predictions 