#!/usr/bin/env python3

"""
Resource Finder - Homeless Services Locator (Simplified Version)

A fast, reliable tool that finds nearby homeless shelters and services.
Optimized for speed and reliability.

Author: AI Assistant
Date: 2024
"""

import os
import json
import requests
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import time
import re
import logging
import argparse
import sys

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not available. Set environment variables manually.")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ServiceResult:
    """Data class to store service search results"""
    name: str
    url: str
    snippet: str
    matching_services: List[str]
    distance_km: Optional[float] = None
    match_score: float = 0.0
    llm_summary: Optional[str] = None
    llm_score: Optional[float] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None

class ResourceFinder:
    """
    Simplified ResourceFinder for fast, reliable results.
    """
    
    def __init__(self, serper_api_key: str):
        """
        Initialize the ResourceFinder with API key.
        
        Args:
            serper_api_key: Serper.dev API key for web search
        """
        self.serper_api_key = serper_api_key
        
        # Available services with shelter priority
        self.available_services = {
            'shelter': ['shelter', 'emergency housing', 'crisis housing', 'overnight accommodation', 'homeless shelter'],
            'showers': ['shower', 'bathroom', 'hygiene', 'clean'],
            'meals': ['meal', 'food', 'dinner', 'lunch', 'breakfast', 'nutrition'],
            'mental_health': ['mental health', 'counseling', 'therapy', 'psychiatrist', 'psychologist'],
            'medical': ['doctor', 'medical', 'healthcare', 'clinic', 'hospital'],
            'laundry': ['laundry', 'washing', 'clothes'],
            'wifi': ['wifi', 'internet', 'computer', 'technology', 'public access']
        }
    
    def get_coordinates(self, location: str) -> Tuple[float, float]:
        """
        Convert location string to coordinates using Nominatim.
        """
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': f"{location}, Canada",
                'format': 'json',
                'limit': 1,
                'countrycodes': 'ca'
            }
            
            headers = {
                'User-Agent': 'ResourceFinder/1.0'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data:
                result = data[0]
                lat = float(result['lat'])
                lng = float(result['lon'])
                logger.info(f"Geocoded '{location}' to coordinates: ({lat}, {lng})")
                return lat, lng
            
        except Exception as e:
            logger.warning(f"Geocoding failed: {e}")
        
        # Fallback coordinates for Toronto
        return (43.6532, -79.3832)
    
    def search_services(self, location: str, selected_services: List[str]) -> List[Dict]:
        """
        Fast search for services using minimal queries.
        """
        all_results = []
        
        # Focus on shelters and emergency housing
        search_queries = [
            f"homeless shelters emergency housing {location}",
            f"emergency shelters overnight accommodation {location}",
            f"homeless shelters crisis housing {location}"
        ]
        
        logger.info(f"Executing {len(search_queries)} search queries")
        
        for i, query in enumerate(search_queries):
            try:
                url = "https://google.serper.dev/search"
                headers = {
                    'X-API-KEY': self.serper_api_key,
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    'q': query,
                    'num': 8,  # Reduced for speed
                    'gl': 'ca'
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=15)
                response.raise_for_status()
                
                data = response.json()
                
                if 'organic' in data:
                    for result in data['organic']:
                        all_results.append(result)
                
                logger.info(f"Query {i+1}/{len(search_queries)}: Found {len(data.get('organic', []))} results")
                
                # Minimal rate limiting
                time.sleep(0.3)
                
            except Exception as e:
                logger.error(f"Search error for query '{query}': {e}")
                continue
        
        # Remove duplicate URLs
        seen_urls = set()
        unique_results = []
        for result in all_results:
            url = result.get('link', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
        
        logger.info(f"Total unique results found: {len(unique_results)}")
        return unique_results
    
    def match_keywords(self, text: str, selected_services: List[str]) -> List[str]:
        """
        Check if text contains keywords for selected services.
        """
        text_lower = text.lower()
        matching_services = []
        
        for service in selected_services:
            if service in self.available_services:
                keywords = self.available_services[service]
                for keyword in keywords:
                    if keyword in text_lower:
                        matching_services.append(service)
                        break
        
        return list(set(matching_services))
    
    def find_resources(self, location: str, selected_services: List[str], 
                      use_llm: bool = False, enhance_with_scraping: bool = True) -> List[ServiceResult]:
        """
        Main method to find resources - simplified for speed.
        """
        logger.info(f"Starting resource search for location: {location}")
        logger.info(f"Selected services: {selected_services}")
        
        # Get coordinates
        try:
            user_coords = self.get_coordinates(location)
            logger.info(f"User coordinates: {user_coords}")
        except Exception as e:
            logger.error(f"Failed to get coordinates: {e}")
            return []
        
        # Search for services
        search_results = self.search_services(location, selected_services)
        
        if not search_results:
            logger.warning("No search results found")
            return []
        
        logger.info(f"Found {len(search_results)} initial search results")
        
        # Process results quickly
        processed_results = []
        
        for result in search_results:
            # Extract text for keyword matching
            text_to_analyze = f"{result.get('title', '')} {result.get('snippet', '')}"
            
            # Match keywords
            matching_services = self.match_keywords(text_to_analyze, selected_services)
            
            # Check if any requested services are provided
            if not any(service in matching_services for service in selected_services):
                continue
            
            # Prioritize shelter-related results
            text_lower = text_to_analyze.lower()
            shelter_keywords = ['shelter', 'emergency housing', 'crisis housing', 'homeless shelter', 'overnight']
            has_shelter_keywords = any(keyword in text_lower for keyword in shelter_keywords)
            
            # Boost score for shelter-related results
            if has_shelter_keywords:
                match_score *= 1.5
            
            # Calculate match score
            service_overlap = len(set(matching_services) & set(selected_services))
            match_score = service_overlap / len(selected_services)
            
            # Create ServiceResult
            service_result = ServiceResult(
                name=result.get('title', 'Unknown'),
                url=result.get('link', ''),
                snippet=result.get('snippet', ''),
                matching_services=matching_services,
                distance_km=None,  # Skip distance calculation for speed
                match_score=match_score,
                llm_summary=None,
                llm_score=None,
                address=None,
                phone=None,
                hours=None
            )
            
            processed_results.append(service_result)
            
            # Stop after 6 results for speed, but ensure minimum of 3
            if len(processed_results) >= 6:
                break
        
        # Ensure we have at least 3 results
        if len(processed_results) < 3:
            logger.warning(f"Only found {len(processed_results)} results, returning what we have")
        else:
            logger.info(f"Found {len(processed_results)} results (minimum 3 required)")
        
        # Sort by match score
        processed_results.sort(key=lambda x: -x.match_score)
        
        logger.info(f"Found {len(processed_results)} relevant results")
        return processed_results

def main():
    """
    Main function for CLI usage with Node.js integration.
    """
    import argparse
    
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Resource Finder - Homeless Services Locator')
    parser.add_argument('--location', required=True, help='Location to search in')
    parser.add_argument('--services', required=True, help='Comma-separated list of services')
    parser.add_argument('--use-llm', action='store_true', help='Use LLM for analysis')
    parser.add_argument('--enhance-scraping', action='store_true', help='Enhance results with scraping')
    parser.add_argument('--output-json', action='store_true', help='Output results as JSON')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Parse services
    selected_services = args.services.split(',')
    
    # Load API key from environment variables
    serper_api_key = os.getenv('SERPER_API_KEY')
    
    if not serper_api_key:
        logger.error("Missing SERPER_API_KEY environment variable")
        print(json.dumps([], indent=2))
        sys.exit(1)
    
    # Initialize resource finder
    finder = ResourceFinder(serper_api_key)
    
    try:
        # Find resources
        logger.info(f"Searching for services in {args.location}...")
        results = finder.find_resources(args.location, selected_services, args.use_llm, args.enhance_scraping)
        
        # Convert results to JSON-serializable format
        json_results = []
        for result in results:
            json_result = asdict(result)
            json_results.append(json_result)
        
        # Output JSON to stdout for Node.js to capture
        print(json.dumps(json_results, indent=2))
        
    except Exception as e:
        logger.error(f"Error in resource finder: {e}")
        print(json.dumps([], indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main() 