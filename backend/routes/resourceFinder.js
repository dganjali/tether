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
  const { location, selectedServices, useLLM = false, enhanceScraping = false } = req.body;
  
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
    
    // Escape location and services for shell safety
    const escapedLocation = location.replace(/"/g, '\\"');
    const escapedServices = servicesArg.replace(/"/g, '\\"');
    
    const command = `python3 "${pythonScript}" "${escapedLocation}" "${escapedServices}" ${useLLM} ${enhanceScraping}`;
    
    logger.info('Executing Python scraper', { command });
    
    exec(command, { 
      timeout: 120000, // 2 minute timeout (increased from 60s)
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, '..'),
        // Ensure environment variables are passed
        SERPER_API_KEY: process.env.SERPER_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY
      },
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
    }, (error, stdout, stderr) => {
      if (error) {
        logger.error('Python scraper error', { 
          error: error.message, 
          stderr,
          code: error.code,
          signal: error.signal
        });
        
        // Handle timeout specifically
        if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
          return res.status(408).json({ 
            success: false, 
            error: 'Request timed out. Please try again with fewer services or a more specific location.' 
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to find resources. Please try again.' 
        });
      }
      
      try {
        // Check if stdout is empty
        if (!stdout || stdout.trim() === '') {
          logger.warn('Python script returned empty output');
          return res.status(200).json({
            success: true,
            results: [],
            total: 0,
            message: 'No resources found for the given criteria.'
          });
        }
        
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
          stdout: stdout.substring(0, 500), // Log first 500 chars
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