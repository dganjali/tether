# Google Maps API Setup Guide

## Prerequisites
1. A Google Cloud Platform account
2. A project with billing enabled

## Steps to Get Your API Key

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

### 2. Enable Required APIs
Enable the following APIs in your Google Cloud Console:
- Maps JavaScript API
- Places API
- Geocoding API

### 3. Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key

### 4. Restrict Your API Key (Recommended)
1. Click on your API key to edit it
2. Under "Application restrictions", select "HTTP referrers"
3. Add your domain (e.g., `localhost:3000/*` for development)
4. Under "API restrictions", select "Restrict key"
5. Select the APIs you enabled in step 2

### 5. Configure in Your Application
Create a `.env` file in the `frontend` directory with:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## Important Notes
- Never commit your API key to version control
- The `.env` file should be in your `.gitignore`
- For production, use environment variables in your hosting platform
- The API key is restricted to specific domains for security

## Troubleshooting
- If you see "YOUR_API_KEY_HERE" on the map, you need to set up your API key
- If you get billing errors, ensure billing is enabled on your Google Cloud project
- If the map doesn't load, check that all required APIs are enabled 