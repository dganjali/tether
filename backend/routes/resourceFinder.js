const express = require('express');
const router = express.Router();
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
    // Mock data for demonstration - in a real app, this would query a database
    // or call external APIs to find actual resources
    const mockResults = [
      {
        name: 'Toronto Homeless Services Center',
        address: '123 Main St, Toronto, ON M5V 2H1',
        phone: '(416) 555-0123',
        hours: '24/7',
        distance_km: 2.1,
        matching_services: selectedServices.slice(0, 3),
        match_score: 0.85,
        snippet: 'Comprehensive homeless services including shelter, meals, and medical care.',
        llm_summary: useLLM ? 'This facility offers excellent comprehensive care with 24/7 access and multiple service types.' : null,
        url: 'https://example.com/toronto-homeless-services'
      },
      {
        name: 'Downtown Community Shelter',
        address: '456 Queen St W, Toronto, ON M5V 2A9',
        phone: '(416) 555-0456',
        hours: '7:00 AM - 10:00 PM',
        distance_km: 3.5,
        matching_services: selectedServices.slice(0, 2),
        match_score: 0.72,
        snippet: 'Community-based shelter providing meals and basic services.',
        llm_summary: useLLM ? 'Good community shelter with limited hours but reliable service.' : null,
        url: 'https://example.com/downtown-community-shelter'
      },
      {
        name: 'Harbourfront Emergency Services',
        address: '789 Lakeshore Blvd, Toronto, ON M5V 3A7',
        phone: '(416) 555-0789',
        hours: '6:00 PM - 8:00 AM',
        distance_km: 4.2,
        matching_services: selectedServices.slice(0, 1),
        match_score: 0.58,
        snippet: 'Emergency overnight shelter with basic amenities.',
        llm_summary: useLLM ? 'Basic emergency shelter with overnight accommodation only.' : null,
        url: 'https://example.com/harbourfront-emergency'
      }
    ];
    
    // Filter results based on selected services
    const filteredResults = mockResults.filter(result => 
      result.matching_services.some(service => selectedServices.includes(service))
    );
    
    // Sort by match score and distance
    const sortedResults = filteredResults.sort((a, b) => {
      if (a.match_score !== b.match_score) {
        return b.match_score - a.match_score;
      }
      return a.distance_km - b.distance_km;
    });
    
    logger.info('Resources found', { 
      count: sortedResults.length,
      location,
      selectedServices 
    });
    
    res.json({
      success: true,
      results: sortedResults,
      total: sortedResults.length
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