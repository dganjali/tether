require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Cache for predictions
let predictionsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for shelters list
let sheltersCache = null;
let lastSheltersCacheTime = 0;
const SHELTERS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Cache for shelter locations
let locationsCache = null;
let lastLocationsCacheTime = 0;
const LOCATIONS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Server is running! Use /api/predictions to get shelter predictions.' });
});

// Get shelter locations for map
app.get('/api/shelter-locations', (req, res) => {
  const now = Date.now();
  
  // Check if we have valid cached data
  if (locationsCache && (now - lastLocationsCacheTime) < LOCATIONS_CACHE_DURATION) {
    console.log('Serving cached shelter locations');
    return res.json(locationsCache);
  }

  console.log('Reading shelter locations from CSV...');
  
  // Read the CSV file directly using Node.js
  const csv = require('csv-parser');
  const fs = require('fs');
  const results = [];
  
  fs.createReadStream(path.join(__dirname, '../data/shelter_locations_geocoded.csv'))
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      try {
        // Cache the results
        locationsCache = results;
        lastLocationsCacheTime = now;
        
        res.json(results);
      } catch (parseError) {
        console.error('CSV parse error:', parseError);
        res.status(500).send("Invalid CSV format");
      }
    })
    .on('error', (error) => {
      console.error('Failed to read shelter locations CSV:', error);
      res.status(500).send("Failed to read shelter locations");
    });
});

// Get available shelters
app.get('/api/shelters', (req, res) => {
  const now = Date.now();
  
  // Check if we have valid cached data
  if (sheltersCache && (now - lastSheltersCacheTime) < SHELTERS_CACHE_DURATION) {
    console.log('Serving cached shelters list');
    return res.json(sheltersCache);
  }

  console.log('Reading shelters from predictions file...');
  
  // Read the predictions file and extract shelter names
  fs.readFile(path.join(__dirname, '../data/predictions.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read predictions.json:', err);
      return res.status(500).send("Failed to read shelters");
    }

    try {
      const predictions = JSON.parse(data);
      const shelters = predictions.map(prediction => ({
        name: prediction.name,
        predicted_influx: prediction.predicted_influx
      }));
      
      // Cache the results
      sheltersCache = shelters;
      lastSheltersCacheTime = now;
      res.json(shelters);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).send("Invalid JSON format in predictions file");
    }
  });
});

// Get forecast for a specific shelter (alternative endpoint)
app.get('/api/forecast', (req, res) => {
  const shelter = req.query.shelter;
  const days = req.query.days || 7;
  
  if (!shelter) {
    return res.status(400).send("Shelter parameter is required");
  }
  
  console.log(`Getting forecast for shelter: ${shelter}, days: ${days}`);
  exec(`../venv/bin/python ../model/predict.py forecast "${shelter}" ${days}`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Python script error:', error);
      console.error('Stderr:', stderr);
      return res.status(500).send("Python script execution failed");
    }

    console.log('Python stdout length:', stdout.length);
    console.log('Python stdout (first 200 chars):', stdout.substring(0, 200));
    
    try {
      // Trim any whitespace and newlines
      const cleanOutput = stdout.trim();
      const json = JSON.parse(cleanOutput);
      res.json(json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw output length:', stdout.length);
      console.error('Raw output:', stdout);
      res.status(500).send("Invalid JSON format from Python script");
    }
  });
});

// Get forecast for a specific shelter
app.get('/api/forecast/:shelter', (req, res) => {
  const shelter = decodeURIComponent(req.params.shelter);
  const days = req.query.days || 7;
  
  console.log(`Getting forecast for shelter: ${shelter}, days: ${days}`);
  exec(`../venv/bin/python ../model/predict.py forecast "${shelter}" ${days}`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Python script error:', error);
      console.error('Stderr:', stderr);
      return res.status(500).send("Python script execution failed");
    }

    try {
      const json = JSON.parse(stdout);
      res.json(json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw output:', stdout);
      res.status(500).send("Invalid JSON format from Python script");
    }
  });
});

app.get('/api/predictions', (req, res) => {
  const now = Date.now();
  
  // Check if we have valid cached data
  if (predictionsCache && (now - lastCacheTime) < CACHE_DURATION) {
    console.log('Serving cached predictions');
    return res.json(predictionsCache);
  }

  console.log('Reading predictions from file...');
  
  // Read the predictions file directly
  fs.readFile(path.join(__dirname, '../data/predictions.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read predictions.json:', err);
      return res.status(500).send("Failed to read predictions");
    }

    try {
      const json = JSON.parse(data);
      // Cache the results
      predictionsCache = json;
      lastCacheTime = now;
      res.json(json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).send("Invalid JSON format in predictions file");
    }
  });
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
