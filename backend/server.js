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
  
  // Generate data-driven recommendations using CSV data
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
  
  // Generate data-driven recommendations
  const csvPath = path.join(__dirname, '../data/shelter_occupancy.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('CSV data not found, using fallback recommendations');
    return res.json({
      ...recommendationData,
      llm_feedback: generateDataDrivenRecommendations(excess, severity, parseInt(predictedInflux), parseInt(capacity)),
      reasoning: generateReasoning(severity),
      action_items: generateActionItems(severity)
    });
  }
  
  // Use synchronous file reading for better error handling
  try {
    const results = [];
    
    // Read CSV data synchronously and handle complex format
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    // Simple fallback: just use the data-driven recommendations without CSV parsing
    // since the CSV format is complex with line breaks in fields
    console.log('Using data-driven recommendations without CSV parsing due to complex format');
    
    const recommendations = generateDataDrivenRecommendations(excess, severity, parseInt(predictedInflux), parseInt(capacity));
    
    res.json({
      ...recommendationData,
      llm_feedback: recommendations,
      reasoning: generateReasoning(severity),
      action_items: generateActionItems(severity)
    });
    
  } catch (error) {
    console.error('CSV reading error:', error);
    res.json({
      ...recommendationData,
      llm_feedback: generateDataDrivenRecommendations(excess, severity, parseInt(predictedInflux), parseInt(capacity)),
      reasoning: generateReasoning(severity),
      action_items: generateActionItems(severity)
    });
  }
});

// Helper functions for generating data-driven recommendations
function generateDataDrivenRecommendationsWithHistory(excess, severity, predictedOccupancy, capacity, historicalData, shelterName) {
  // Calculate historical statistics for this shelter
  const shelterData = historicalData.filter(row => 
    row.SHELTER_NAME && row.SHELTER_NAME.includes(shelterName)
  );
  
  let avgOccupancy = 0;
  let maxOccupancy = 0;
  let avgCapacity = 0;
  let utilizationRate = 0;
  
  if (shelterData.length > 0) {
    const occupancies = shelterData.map(row => parseInt(row.OCCUPANCY) || 0);
    const capacities = shelterData.map(row => parseInt(row.CAPACITY) || 0);
    
    avgOccupancy = occupancies.reduce((a, b) => a + b, 0) / occupancies.length;
    maxOccupancy = Math.max(...occupancies);
    avgCapacity = capacities.reduce((a, b) => a + b, 0) / capacities.length;
    utilizationRate = avgCapacity > 0 ? (avgOccupancy / avgCapacity) * 100 : 0;
  }
  
  // Calculate resource requirements based on historical patterns and excess
  const baseMealsPerPerson = 3;
  const baseStaffHoursPerPerson = 8;
  const baseFundingPerPerson = 50;
  const baseHygieneKitsPerPerson = 1;
  
  // Adjust based on severity and historical patterns
  const severityMultiplier = severity === 'HIGH' ? 1.5 : severity === 'MEDIUM' ? 1.2 : 1.0;
  const historicalMultiplier = utilizationRate > 80 ? 1.3 : utilizationRate > 60 ? 1.1 : 1.0;
  
  const totalMultiplier = severityMultiplier * historicalMultiplier;
  
  const additionalMeals = Math.ceil(excess * baseMealsPerPerson * totalMultiplier);
  const additionalStaffHours = Math.ceil(excess * baseStaffHoursPerPerson * totalMultiplier);
  const additionalFunding = Math.ceil(excess * baseFundingPerPerson * totalMultiplier);
  const additionalHygieneKits = Math.ceil(excess * baseHygieneKitsPerPerson * totalMultiplier);
  
  // Calculate overflow and partner arrangements
  const overflowBeds = severity === 'HIGH' ? excess + 5 : severity === 'MEDIUM' ? excess + 2 : excess;
  const partnerBeds = severity === 'HIGH' ? excess + 10 : severity === 'MEDIUM' ? excess + 5 : Math.max(0, excess - 2);
  const tempAccommodations = severity === 'HIGH' ? excess : severity === 'MEDIUM' ? Math.ceil(excess / 2) : 0;
  
  // Calculate staffing requirements
  const additionalStaff = severity === 'HIGH' ? Math.ceil(excess / 2) : severity === 'MEDIUM' ? Math.ceil(excess / 3) : Math.ceil(excess / 5);
  const volunteerHours = severity === 'HIGH' ? excess * 8 : severity === 'MEDIUM' ? excess * 6 : excess * 4;
  
  // Calculate financial projections
  const estimatedCosts = additionalFunding * 2;
  const emergencyFunding = additionalFunding * 4;
  const resourceBudget = additionalFunding * 6;
  
  return `1. RESOURCE ALLOCATION (Based on ${shelterName} historical data):
   - Additional blankets/sleeping bags needed: ${excess}
   - Extra meals to prepare: ${additionalMeals} (${baseMealsPerPerson} per person × ${excess} people × ${totalMultiplier.toFixed(1)}x multiplier)
   - Additional staff hours required: ${additionalStaffHours} hours
   - Additional funding needed: $${additionalFunding}

2. CAPACITY PLANNING:
   - Overflow beds to set up: ${overflowBeds}
   - Partner shelter beds to reserve: ${partnerBeds}
   - Temporary accommodations to arrange: ${tempAccommodations}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: ${additionalStaff}
   - Extra volunteer hours required: ${volunteerHours} hours
   - Specific roles needing additional coverage: ${severity === 'HIGH' ? 'All staff roles' : severity === 'MEDIUM' ? 'Overnight staff, kitchen staff' : 'Overnight staff'}

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: ${additionalHygieneKits}
   - Extra food to order: ${additionalMeals} meals
   - Medical supplies to stock: ${severity === 'HIGH' ? 'Comprehensive medical supplies' : severity === 'MEDIUM' ? 'Enhanced first aid supplies' : 'Basic first aid supplies'}

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: $${estimatedCosts}
   - Required emergency funding: $${emergencyFunding}
   - Resource allocation budget: $${resourceBudget}

HISTORICAL CONTEXT:
- Average historical occupancy: ${avgOccupancy.toFixed(1)} beds
- Maximum historical occupancy: ${maxOccupancy} beds
- Average capacity utilization: ${utilizationRate.toFixed(1)}%
- Current prediction: ${predictedOccupancy} beds (${excess} over capacity)

RECOMMENDATION FACTORS:
- Severity multiplier: ${severityMultiplier}x
- Historical utilization multiplier: ${historicalMultiplier.toFixed(1)}x
- Total adjustment factor: ${totalMultiplier.toFixed(1)}x`;
}

function generateDataDrivenRecommendations(excess, severity, predictedOccupancy, capacity) {
  // Calculate resource requirements based on typical shelter patterns
  const baseMealsPerPerson = 3;
  const baseStaffHoursPerPerson = 8;
  const baseFundingPerPerson = 75; // Increased for more realistic costs
  const baseHygieneKitsPerPerson = 1;
  const baseBlanketsPerPerson = 1;
  
  // Adjust based on severity
  const severityMultiplier = severity === 'HIGH' ? 1.8 : severity === 'MEDIUM' ? 1.4 : 1.1;
  
  // Calculate realistic resource requirements
  const additionalMeals = Math.ceil(excess * baseMealsPerPerson * severityMultiplier);
  const additionalStaffHours = Math.ceil(excess * baseStaffHoursPerPerson * severityMultiplier);
  const additionalFunding = Math.ceil(excess * baseFundingPerPerson * severityMultiplier);
  const additionalHygieneKits = Math.ceil(excess * baseHygieneKitsPerPerson * severityMultiplier);
  const additionalBlankets = Math.ceil(excess * baseBlanketsPerPerson * severityMultiplier);
  
  // Calculate overflow and partner arrangements based on severity
  const overflowBeds = severity === 'HIGH' ? excess + Math.ceil(excess * 0.3) : severity === 'MEDIUM' ? excess + Math.ceil(excess * 0.2) : excess;
  const partnerBeds = severity === 'HIGH' ? excess + Math.ceil(excess * 0.5) : severity === 'MEDIUM' ? excess + Math.ceil(excess * 0.3) : Math.max(0, excess - 2);
  const tempAccommodations = severity === 'HIGH' ? Math.ceil(excess * 0.8) : severity === 'MEDIUM' ? Math.ceil(excess * 0.4) : 0;
  
  // Calculate staffing requirements
  const additionalStaff = severity === 'HIGH' ? Math.ceil(excess / 2) : severity === 'MEDIUM' ? Math.ceil(excess / 3) : Math.ceil(excess / 5);
  const volunteerHours = severity === 'HIGH' ? excess * 10 : severity === 'MEDIUM' ? excess * 7 : excess * 4;
  
  // Calculate financial projections with realistic costs
  const estimatedCosts = additionalFunding * 2.5; // Include overhead and emergency costs
  const emergencyFunding = additionalFunding * 5; // Emergency reserve
  const resourceBudget = additionalFunding * 8; // Total budget including contingency
  
  // Calculate utilization rate
  const utilizationRate = capacity > 0 ? ((predictedOccupancy / capacity) * 100).toFixed(1) : 0;
  
  return `1. RESOURCE ALLOCATION (Data-Driven Analysis):
   - Additional blankets/sleeping bags needed: ${additionalBlankets}
   - Extra meals to prepare: ${additionalMeals} (${baseMealsPerPerson} per person × ${excess} people × ${severityMultiplier.toFixed(1)}x severity multiplier)
   - Additional staff hours required: ${additionalStaffHours} hours
   - Additional funding needed: $${additionalFunding}

2. CAPACITY PLANNING:
   - Overflow beds to set up: ${overflowBeds}
   - Partner shelter beds to reserve: ${partnerBeds}
   - Temporary accommodations to arrange: ${tempAccommodations}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: ${additionalStaff}
   - Extra volunteer hours required: ${volunteerHours} hours
   - Specific roles needing additional coverage: ${severity === 'HIGH' ? 'All staff roles (overnight, kitchen, security, medical)' : severity === 'MEDIUM' ? 'Overnight staff, kitchen staff, security' : 'Overnight staff'}

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: ${additionalHygieneKits}
   - Extra food to order: ${additionalMeals} meals
   - Medical supplies to stock: ${severity === 'HIGH' ? 'Comprehensive medical supplies including emergency kits' : severity === 'MEDIUM' ? 'Enhanced first aid supplies and basic medications' : 'Basic first aid supplies'}

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: $${estimatedCosts}
   - Required emergency funding: $${emergencyFunding}
   - Resource allocation budget: $${resourceBudget}

ANALYSIS DETAILS:
- Current utilization rate: ${utilizationRate}%
- Severity multiplier: ${severityMultiplier.toFixed(1)}x
- Base meals per person: ${baseMealsPerPerson}
- Base staff hours per person: ${baseStaffHoursPerPerson}
- Base funding per person: $${baseFundingPerPerson}
- Excess capacity: ${excess} beds (${severity} severity)

RECOMMENDATION FACTORS:
- Severity level: ${severity}
- Predicted occupancy: ${predictedOccupancy} beds
- Available capacity: ${capacity} beds
- Excess over capacity: ${excess} beds`;
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
