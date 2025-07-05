# Google Maps API Setup

To enable the interactive map functionality, you need to set up a Google Maps API key.

## Steps:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
   - Create credentials (API Key)
   - Copy your API key

2. **Set up the environment variable:**
   - Create a `.env` file in the `frontend` directory
   - Add your API key:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Restart the frontend application:**
   ```bash
   cd frontend
   npm start
   ```

## Features:
- Interactive map showing all Toronto shelter locations
- Color-coded markers based on predicted influx:
  - 🟢 Green: Normal (<80)
  - 🟡 Yellow: Warning (80-150)
  - 🔴 Red: Critical (>150)
- Click markers to see shelter details
- Sidebar with list of all shelters and their status

## Notes:
- The map will automatically geocode shelter addresses from the CSV data
- First time loading may take a few seconds to generate location data
- If geocoding fails for some addresses, those shelters won't appear on the map 