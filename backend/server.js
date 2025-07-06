require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userShelterRoutes = require('./routes/userShelters');
const alertRoutes = require('./routes/alerts');
const recordedDataRoutes = require('./routes/recordedData');
const { 
  globalErrorHandler, 
  notFoundHandler, 
  asyncHandler,
  handleDatabaseError,
  handleFileSystemError,
  handlePythonScriptError,
  ValidationError,
  NotFoundError,
  FileSystemError,
  PythonScriptError
} = require('./utils/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET environment variable is not set. Authentication will not work properly.');
  process.env.JWT_SECRET = 'fallback-secret-key-change-in-production';
}

// Connect to MongoDB with better error handling
if (process.env.MONGODB_URI) {
  const startTime = Date.now();
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const duration = Date.now() - startTime;
    logger.info('Connected to MongoDB', { duration: `${duration}ms` });
    logger.logDatabaseOperation('connect', 'mongodb', duration, true);
  })
  .catch(err => {
    const duration = Date.now() - startTime;
    const dbError = handleDatabaseError(err);
    logger.error('MongoDB connection failed', { 
      error: err.message, 
      duration: `${duration}ms`,
      code: err.code 
    });
    logger.logDatabaseOperation('connect', 'mongodb', duration, false);
  });
} else {
  logger.warn('MONGODB_URI environment variable is not set. Database functionality will be disabled.');
}

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

// Add request logging middleware
app.use(logger.logRequest.bind(logger));

// Serve static files from the React build directory
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  logger.info('Serving static files from frontend build', { path: frontendBuildPath });
  app.use(express.static(frontendBuildPath));
} else {
  logger.warn('Frontend build directory not found', { path: frontendBuildPath });
}

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/user-shelters', userShelterRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/recorded-data', recordedDataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

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
  
  const csvPath = path.join(__dirname, '../data/shelter_locations_geocoded.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('Shelter locations CSV file not found:', csvPath);
    return res.status(500).json({ error: 'Shelter locations file not found' });
  }
  
  fs.createReadStream(csvPath)
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
        res.status(500).json({ error: "Invalid CSV format" });
      }
    })
    .on('error', (error) => {
      console.error('Failed to read shelter locations CSV:', error);
      res.status(500).json({ error: "Failed to read shelter locations" });
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
  const predictionsPath = path.join(__dirname, '../data/predictions.json');
  
  if (!fs.existsSync(predictionsPath)) {
    console.error('Predictions file not found:', predictionsPath);
    return res.status(500).json({ error: 'Predictions file not found' });
  }
  
  fs.readFile(predictionsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read predictions.json:', err);
      return res.status(500).json({ error: "Failed to read shelters" });
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
      res.status(500).json({ error: "Invalid JSON format in predictions file" });
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
      return res.status(500).json({ error: "Python script execution failed" });
    }

    try {
      const json = JSON.parse(stdout);
      res.json(json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw output:', stdout);
      res.status(500).json({ error: "Invalid JSON format from Python script" });
    }
  });
});

// Get AI-powered recommendations based on predicted influx
app.get('/api/recommendations', (req, res) => {
  const shelter = req.query.shelter;
  const predictedInflux = req.query.influx;
  const capacity = req.query.capacity;
  
  if (!shelter || !predictedInflux || !capacity) {
    return res.status(400).json({ 
      error: "Missing required parameters: shelter, influx, and capacity are required" 
    });
  }
  
  console.log(`Getting recommendations for shelter: ${shelter}, influx: ${predictedInflux}, capacity: ${capacity}`);
  
  // Calculate excess capacity
  const excess = Math.max(0, parseInt(predictedInflux) - parseInt(capacity));
  const severity = excess <= 2 ? "LOW" : excess <= 5 ? "MEDIUM" : "HIGH";
  const excessPercentage = capacity > 0 ? ((excess / parseInt(capacity)) * 100).toFixed(1) : 0;
  
  // Generate recommendations using the ML-LLM system
  const recommendationData = {
    shelter_name: shelter,
    predicted_occupancy: parseInt(predictedInflux),
    capacity: parseInt(capacity),
    excess: excess,
    severity: severity,
    excess_percentage: excessPercentage,
    capacity_utilization_rate: capacity > 0 ? ((parseInt(predictedInflux) / parseInt(capacity)) * 100).toFixed(1) : 0,
    date: new Date().toISOString().split('T')[0]
  };
  
  // Generate LLM feedback
  const llmScriptPath = path.join(__dirname, '../ML-LLM-hybrid-recommendation-system/llm_feedback.py');
  
  // Check if the LLM script exists
  if (!fs.existsSync(llmScriptPath)) {
    console.log('LLM script not found, using fallback recommendations');
    return res.json({
      ...recommendationData,
      llm_feedback: generateBasicRecommendations(excess, severity),
      reasoning: generateReasoning(severity),
      action_items: generateActionItems(severity)
    });
  }
  
  exec(`python3 "${llmScriptPath}" "${JSON.stringify(recommendationData)}"`, { 
    cwd: __dirname,
    env: { ...process.env, PYTHONPATH: path.join(__dirname, '../ML-LLM-hybrid-recommendation-system') }
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('LLM feedback error:', error);
      console.error('Stderr:', stderr);
      // Return basic recommendations if LLM fails
      return res.json({
        ...recommendationData,
        llm_feedback: generateBasicRecommendations(excess, severity),
        reasoning: generateReasoning(severity),
        action_items: generateActionItems(severity)
      });
    }

    try {
      const llmFeedback = stdout.trim();
      res.json({
        ...recommendationData,
        llm_feedback: llmFeedback,
        reasoning: generateReasoning(severity),
        action_items: generateActionItems(severity)
      });
    } catch (parseError) {
      console.error('LLM feedback parse error:', parseError);
      res.json({
        ...recommendationData,
        llm_feedback: generateBasicRecommendations(excess, severity),
        reasoning: generateReasoning(severity),
        action_items: generateActionItems(severity)
      });
    }
  });
});

// Helper functions for generating recommendations
function generateBasicRecommendations(excess, severity) {
  const recommendations = {
    LOW: `1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: ${excess}
   - Extra meals to prepare: ${excess * 3}
   - Additional staff hours required: ${excess * 8}
   - Additional funding needed: $${excess * 50}

2. CAPACITY PLANNING:
   - Overflow beds to set up: ${excess}
   - Partner shelter beds to reserve: ${Math.max(0, excess - 2)}
   - Temporary accommodations to arrange: 0

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: ${Math.ceil(excess / 5)}
   - Extra volunteer hours required: ${excess * 4}
   - Specific roles needing additional coverage: Overnight staff

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: ${excess}
   - Extra food to order: ${excess * 3} meals
   - Medical supplies to stock: Basic first aid supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: $${excess * 100}
   - Required emergency funding: $${excess * 200}
   - Resource allocation budget: $${excess * 300}`,
    
    MEDIUM: `1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: ${excess}
   - Extra meals to prepare: ${excess * 3}
   - Additional staff hours required: ${excess * 12}
   - Additional funding needed: $${excess * 75}

2. CAPACITY PLANNING:
   - Overflow beds to set up: ${excess + 2}
   - Partner shelter beds to reserve: ${excess + 5}
   - Temporary accommodations to arrange: ${Math.ceil(excess / 2)}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: ${Math.ceil(excess / 3)}
   - Extra volunteer hours required: ${excess * 6}
   - Specific roles needing additional coverage: Overnight staff, kitchen staff

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: ${excess + 2}
   - Extra food to order: ${excess * 4} meals
   - Medical supplies to stock: Enhanced first aid supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: $${excess * 150}
   - Required emergency funding: $${excess * 300}
   - Resource allocation budget: $${excess * 450}`,
    
    HIGH: `1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: ${excess}
   - Extra meals to prepare: ${excess * 3}
   - Additional staff hours required: ${excess * 16}
   - Additional funding needed: $${excess * 100}

2. CAPACITY PLANNING:
   - Overflow beds to set up: ${excess + 5}
   - Partner shelter beds to reserve: ${excess + 10}
   - Temporary accommodations to arrange: ${excess}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: ${Math.ceil(excess / 2)}
   - Extra volunteer hours required: ${excess * 8}
   - Specific roles needing additional coverage: All staff roles

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: ${excess + 5}
   - Extra food to order: ${excess * 5} meals
   - Medical supplies to stock: Comprehensive medical supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: $${excess * 200}
   - Required emergency funding: $${excess * 400}
   - Resource allocation budget: $${excess * 600}`
  };
  
  return recommendations[severity] || recommendations.LOW;
}

function generateReasoning(severity) {
  const reasoning = {
    LOW: ["Capacity is slightly exceeded, requiring minimal additional resources."],
    MEDIUM: ["Moderate capacity overflow detected, requiring increased resource allocation and staffing."],
    HIGH: ["Significant capacity overflow detected, requiring emergency protocols and maximum resource allocation."]
  };
  
  return reasoning[severity] || reasoning.LOW;
}

function generateActionItems(severity) {
  const actionItems = {
    LOW: [
      "Monitor occupancy trends closely",
      "Prepare contingency plans if situation worsens"
    ],
    MEDIUM: [
      "Increase staff coverage for the predicted period",
      "Prepare overflow space if available",
      "Monitor situation closely for escalation"
    ],
    HIGH: [
      "Immediate activation of emergency overflow protocols",
      "Contact partner shelters for temporary bed arrangements",
      "Consider opening temporary warming centers if weather-related"
    ]
  };
  
  return actionItems[severity] || actionItems.LOW;
}

app.get('/api/predictions', (req, res) => {
  const now = Date.now();
  
  // Check if we have valid cached data
  if (predictionsCache && (now - lastCacheTime) < CACHE_DURATION) {
    console.log('Serving cached predictions');
    return res.json(predictionsCache);
  }

  console.log('Reading predictions from file...');
  
  // Read the predictions file directly
  const predictionsPath = path.join(__dirname, '../data/predictions.json');
  
  if (!fs.existsSync(predictionsPath)) {
    console.error('Predictions file not found:', predictionsPath);
    return res.status(500).json({ error: 'Predictions file not found' });
  }
  
  fs.readFile(predictionsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read predictions.json:', err);
      return res.status(500).json({ error: "Failed to read predictions" });
    }

    try {
      const json = JSON.parse(data);
      
      // Add default capacity values to predictions
      const predictionsWithCapacity = json.map(prediction => ({
        ...prediction,
        capacity: prediction.capacity || Math.max(100, Math.round(prediction.predicted_influx * 1.2)) // Default capacity based on predicted influx
      }));
      
      // Cache the results
      predictionsCache = predictionsWithCapacity;
      lastCacheTime = now;
      
      res.json(predictionsWithCapacity);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).json({ error: "Invalid JSON format in predictions file" });
    }
  });
});

// Global error handling middleware (must be before catch-all)
app.use(globalErrorHandler);

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Catch-all handler for React Router - serve index.html for any non-API route
app.get('*', (req, res) => {
  // Serve index.html for all other routes (React Router)
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Frontend not built',
      expectedPath: indexPath,
      buildExists: fs.existsSync(path.join(__dirname, '../frontend/build')),
      buildContents: fs.existsSync(path.join(__dirname, '../frontend/build')) ? 
        fs.readdirSync(path.join(__dirname, '../frontend/build')) : []
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Frontend build path: ${frontendBuildPath}`);
  console.log(`📁 Frontend build exists: ${fs.existsSync(frontendBuildPath)}`);
});
