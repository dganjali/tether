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
    // Call the Python scraper script with proper arguments
    const pythonScript = path.join(__dirname, '../scraper.py');
    const servicesArg = selectedServices.join(',');
    
    // Build the command with proper argument structure
    const useLLMFlag = useLLM ? '--use-llm' : '';
    const enhanceScrapingFlag = enhanceScraping ? '--enhance-scraping' : '';
    const command = `python3 "${pythonScript}" --location "${location}" --services "${servicesArg}" ${useLLMFlag} ${enhanceScrapingFlag} --output-json`;
    
    logger.info('Executing Python scraper', { command });
    
    exec(command, { 
      timeout: 90000, // 1.5 minutes timeout for Toronto-specific searches
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, '..'),
        // Ensure environment variables are passed
        SERPER_API_KEY: process.env.SERPER_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY
      },
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer (reduced)
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
            error: 'Request timed out. Toronto shelter search is taking longer than expected. Please try again.' 
          });
        }
        
        // Return actual error instead of fake data
        return res.status(500).json({
          success: false,
          error: `Python script failed: ${error.message}`,
          details: stderr
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
        
        // Return actual error instead of fake data
        return res.status(500).json({
          success: false,
          error: `Failed to parse Python script output: ${parseError.message}`,
          details: stdout.substring(0, 500)
        });
      }
    });
    
  } catch (error) {
    logger.error('Error finding resources', { error: error.message });
    
    // Return actual error instead of fake data
    return res.status(500).json({
      success: false,
      error: `System error: ${error.message}`
    });
  }
}));

module.exports = router; 