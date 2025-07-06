const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const { asyncHandler } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Available services endpoint
router.get('/available-services', asyncHandler(async (req, res) => {
  logger.info('Fetching available services');
  
  const services = {
    'showers': 'Showers & Hygiene',
    'meals': 'Meals & Food',
    'mental_health': 'Mental Health Services',
    'medical': 'Medical Care',
    'laundry': 'Laundry Services',
    'wifi': 'WiFi & Internet',
    'shelter': 'Emergency Shelter',
    'clothing': 'Clothing & Supplies',
    'counseling': 'Counseling Services',
    'job_assistance': 'Job Assistance',
    'legal_aid': 'Legal Aid',
    'substance_abuse': 'Substance Abuse Support'
  };
  
  res.json({ services });
}));

// Find resources endpoint
router.post('/find-resources', asyncHandler(async (req, res) => {
  const { location, selectedServices, useLLM = false, enhanceScraping = true } = req.body;
  
  logger.info('Finding resources', { 
    location, 
    selectedServices, 
    useLLM, 
    enhanceScraping 
  });
  
  // Validate input
  if (!location || !selectedServices || selectedServices.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Location and at least one service are required' 
    });
  }
  
  try {
    // Call the Python scraper script
    const pythonScript = path.join(__dirname, '../scraper.py');
    const servicesArg = selectedServices.join(',');
    
    const command = `python3 "${pythonScript}" "${location}" "${servicesArg}" ${useLLM} ${enhanceScraping}`;
    
    logger.info('Executing Python scraper', { command });
    
    exec(command, { 
      timeout: 60000, // 60 second timeout
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, '..')
      }
    }, (error, stdout, stderr) => {
      if (error) {
        logger.error('Python scraper error', { error: error.message, stderr });
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to find resources. Please try again.' 
        });
      }
      
      try {
        // Parse the JSON output from the Python script
        const results = JSON.parse(stdout);
        
        logger.info('Resources found', { 
          count: results.length,
          location,
          selectedServices 
        });
        
        res.json({
          success: true,
          results: results,
          total: results.length
        });
        
      } catch (parseError) {
        logger.error('Failed to parse Python script output', { 
          error: parseError.message, 
          stdout, 
          stderr 
        });
        res.status(500).json({ 
          success: false, 
          error: 'Failed to process results from scraper.' 
        });
      }
    });
    
  } catch (error) {
    logger.error('Error finding resources', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to find resources. Please try again.' 
    });
  }
}));

module.exports = router; 