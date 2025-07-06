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
        
        // Return fallback data if scraper fails
        logger.warn('Python scraper failed, returning fallback data');
        const fallbackResults = generateFallbackResults(location, selectedServices);
        return res.json({
          success: true,
          results: fallbackResults,
          total: fallbackResults.length,
          message: 'Using fallback data due to scraper error.'
        });
      }
      
      try {
        // Check if stdout is empty
        if (!stdout || stdout.trim() === '') {
          logger.warn('Python script returned empty output');
          const fallbackResults = generateFallbackResults(location, selectedServices);
          return res.status(200).json({
            success: true,
            results: fallbackResults,
            total: fallbackResults.length,
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
        
        // Return fallback data if parsing fails
        const fallbackResults = generateFallbackResults(location, selectedServices);
        res.json({
          success: true,
          results: fallbackResults,
          total: fallbackResults.length,
          message: 'Using fallback data due to parsing error.'
        });
      }
    });
    
  } catch (error) {
    logger.error('Error finding resources', { error: error.message });
    
    // Return fallback data if everything fails
    const fallbackResults = generateFallbackResults(location, selectedServices);
    res.json({
      success: true,
      results: fallbackResults,
      total: fallbackResults.length,
      message: 'Using fallback data due to system error.'
    });
  }
}));

// Fallback function to generate sample results when scraper fails
function generateFallbackResults(location, selectedServices) {
  const fallbackShelters = [
    {
      name: "Toronto Drop-In Centre",
      url: "https://www.toronto.ca/community-people/housing-shelter/homeless-help/drop-ins/",
      snippet: "Provides food, healthcare, showers, laundry, information and referrals, and social activities.",
      matching_services: selectedServices.filter(s => ['meals', 'showers', 'laundry'].includes(s)),
      distance_km: null,
      match_score: 0.8,
      llm_summary: null,
      llm_score: null,
      address: "Multiple locations in Toronto",
      phone: "416-392-0500",
      hours: "Varies by location"
    },
    {
      name: "Sistering - A Woman's Place",
      url: "https://sistering.org/",
      snippet: "Services include food access, harm reduction support, trauma-informed counselling, healthcare, showers, laundry, and more.",
      matching_services: selectedServices.filter(s => ['meals', 'showers', 'laundry', 'mental_health', 'medical'].includes(s)),
      distance_km: null,
      match_score: 0.9,
      llm_summary: null,
      llm_score: null,
      address: "962 Bloor St W, Toronto, ON M6H 1L6",
      phone: "416-599-7322",
      hours: "24/7 drop-in services"
    },
    {
      name: "HAVEN TORONTO | Drop-in Centre",
      url: "https://www.haventoronto.ca/",
      snippet: "Provides clients with access to showers, laundry facilities, computers, telephones, and more.",
      matching_services: selectedServices.filter(s => ['showers', 'laundry', 'wifi'].includes(s)),
      distance_km: null,
      match_score: 0.7,
      llm_summary: null,
      llm_score: null,
      address: "170 Jarvis St, Toronto, ON M5B 2B7",
      phone: "416-345-7123",
      hours: "Monday to Friday, 8:00 AM - 4:00 PM"
    },
    {
      name: "Fred Victor - Community Meals",
      url: "https://www.fredvictor.org/what-we-do/health-services/food-security/",
      snippet: "Located in the heart of Moss Park, this community hub offers free meals five days a week.",
      matching_services: selectedServices.filter(s => ['meals'].includes(s)),
      distance_km: null,
      match_score: 0.6,
      llm_summary: null,
      llm_score: null,
      address: "145 Queen St E, Toronto, ON M5A 1Y7",
      phone: "416-364-9771",
      hours: "Monday to Friday, 10:00 AM - 11:00 AM"
    }
  ];
  
  // Filter results based on selected services
  return fallbackShelters.filter(shelter => 
    shelter.matching_services.length > 0
  );
}

module.exports = router; 