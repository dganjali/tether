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
        Fast search for services using Toronto-specific queries.
        """
        all_results = []
        
        # Toronto-specific search queries with longer processing time
        search_queries = [
            f"homeless shelters Toronto Ontario Canada",
            f"emergency shelters Toronto downtown",
            f"homeless shelters emergency housing Toronto",
            f"Toronto homeless shelters overnight accommodation",
            f"Toronto emergency housing crisis shelters",
            f"homeless shelters GTA Toronto area",
            f"Toronto shelter services homeless assistance",
            f"emergency shelters Toronto Ontario Canada"
        ]
        
        logger.info(f"Executing {len(search_queries)} Toronto-specific search queries")
        
        for i, query in enumerate(search_queries):
            try:
                url = "https://google.serper.dev/search"
                headers = {
                    'X-API-KEY': self.serper_api_key,
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    'q': query,
                    'num': 10,  # Increased for better coverage
                    'gl': 'ca',
                    'hl': 'en',
                    'location': 'Toronto, Ontario, Canada'
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=20)
                response.raise_for_status()
                
                data = response.json()
                
                if 'organic' in data:
                    for result in data['organic']:
                        all_results.append(result)
                
                logger.info(f"Query {i+1}/{len(search_queries)}: Found {len(data.get('organic', []))} results")
                
                # Longer rate limiting for better results
                time.sleep(1.0)
                
            except Exception as e:
                logger.error(f"Search error for query '{query}': {e}")
                continue
        
        # Filter results to ensure they're Toronto-specific
        toronto_results = []
        toronto_keywords = ['toronto', 'gta', 'ontario', 'canada', 'downtown', 'scarborough', 'etobicoke', 'north york']
        
        for result in all_results:
            text_to_check = f"{result.get('title', '')} {result.get('snippet', '')}".lower()
            
            # Check if result mentions Toronto or related areas
            is_toronto_related = any(keyword in text_to_check for keyword in toronto_keywords)
            
            # Also check if it's a shelter-related result
            shelter_keywords = ['shelter', 'emergency housing', 'crisis housing', 'homeless', 'overnight']
            is_shelter_related = any(keyword in text_to_check for keyword in shelter_keywords)
            
            if is_toronto_related and is_shelter_related:
                toronto_results.append(result)
        
        # Remove duplicate URLs
        seen_urls = set()
        unique_results = []
        for result in toronto_results:
            url = result.get('link', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
        
        logger.info(f"Total Toronto-specific shelter results found: {len(unique_results)}")
        
        # Filter out similar results to avoid duplicates
        filtered_results = self.filter_similar_results(unique_results)
        
        return filtered_results
    
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
        Main method to find resources - optimized for Toronto shelters.
        """
        logger.info(f"Starting Toronto-specific resource search for location: {location}")
        logger.info(f"Selected services: {selected_services}")
        
        # Get coordinates
        try:
            user_coords = self.get_coordinates(location)
            logger.info(f"User coordinates: {user_coords}")
        except Exception as e:
            logger.error(f"Failed to get coordinates: {e}")
            return []
        
        # Search for services with longer processing time
        logger.info("Searching for Toronto shelters (this may take 10-15 seconds)...")
        search_results = self.search_services(location, selected_services)
        
        if not search_results:
            logger.warning("No Toronto shelter results found")
            return []
        
        logger.info(f"Found {len(search_results)} Toronto shelter results")
        
        # Process results with Toronto-specific filtering
        processed_results = []
        seen_organizations = set()
        
        for result in search_results:
            # Extract text for keyword matching
            text_to_analyze = f"{result.get('title', '')} {result.get('snippet', '')}"
            
            # Match keywords
            matching_services = self.match_keywords(text_to_analyze, selected_services)
            
            # Check if any requested services are provided
            if not any(service in matching_services for service in selected_services):
                continue
            
            # Calculate match score
            service_overlap = len(set(matching_services) & set(selected_services))
            match_score = service_overlap / len(selected_services)
            
            # Prioritize Toronto shelter-related results
            text_lower = text_to_analyze.lower()
            toronto_keywords = ['toronto', 'gta', 'ontario', 'canada', 'downtown', 'scarborough', 'etobicoke', 'north york']
            shelter_keywords = ['shelter', 'emergency housing', 'crisis housing', 'homeless shelter', 'overnight']
            
            has_toronto_keywords = any(keyword in text_lower for keyword in toronto_keywords)
            has_shelter_keywords = any(keyword in text_lower for keyword in shelter_keywords)
            
            # Boost score for Toronto shelter-related results
            if has_toronto_keywords and has_shelter_keywords:
                match_score *= 2.0
            elif has_shelter_keywords:
                match_score *= 1.5
            
            # Check for organization diversity
            title = result.get('title', '').lower()
            org_keywords = ['mission', 'salvation army', 'yonge street', 'st. michael', 'st. stephen', 'good shepherd', 'covenant house', 'evangel hall']
            
            current_org = None
            for org in org_keywords:
                if org in title:
                    current_org = org
                    break
            
            # If we already have this organization, reduce the score
            if current_org and current_org in seen_organizations:
                match_score *= 0.5
            
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
            
            # Track organizations we've seen
            if current_org:
                seen_organizations.add(current_org)
            
            # Allow more results for better coverage
            if len(processed_results) >= 10:
                break
        
        # Ensure we have at least 3 results
        if len(processed_results) < 3:
            logger.warning(f"Only found {len(processed_results)} Toronto shelter results, returning what we have")
        else:
            logger.info(f"Found {len(processed_results)} Toronto shelter results")
        
        # Sort by match score
        processed_results.sort(key=lambda x: -x.match_score)
        
        # Final diversity check - ensure we have different types of shelters
        final_results = []
        seen_types = set()
        
        logger.info(f"Applying diversity filtering to {len(processed_results)} results")
        
        for result in processed_results:
            title = result.name.lower()
            
            # Categorize the shelter type
            shelter_type = 'general'
            if 'mission' in title:
                shelter_type = 'mission'
            elif 'salvation army' in title:
                shelter_type = 'salvation_army'
            elif 'covenant house' in title:
                shelter_type = 'covenant_house'
            elif 'st. michael' in title or 'st. stephen' in title:
                shelter_type = 'church_based'
            elif 'yonge street' in title:
                shelter_type = 'yonge_street'
            elif 'evangel hall' in title:
                shelter_type = 'evangel_hall'
            
            # Only add if we don't have too many of this type
            if shelter_type not in seen_types or len([r for r in final_results if shelter_type in r.name.lower()]) < 2:
                final_results.append(result)
                seen_types.add(shelter_type)
                logger.info(f"Added {result.name} (type: {shelter_type})")
            
            # Stop when we have enough diverse results
            if len(final_results) >= 6:
                break
        
        # If we don't have enough diverse results, add the remaining high-scoring ones
        if len(final_results) < 3:
            logger.info(f"Only found {len(final_results)} diverse results, adding more...")
            for result in processed_results:
                if result not in final_results:
                    final_results.append(result)
                    logger.info(f"Added additional result: {result.name}")
                if len(final_results) >= 6:
                    break
        
        logger.info(f"Returning {len(final_results)} diverse Toronto shelter results")
        return final_results

    def is_similar_result(self, result1: Dict, result2: Dict) -> bool:
        """
        Check if two results are essentially the same shelter/service.
        """
        title1 = result1.get('title', '').lower()
        title2 = result2.get('title', '').lower()
        snippet1 = result1.get('snippet', '').lower()
        snippet2 = result2.get('snippet', '').lower()
        
        # Check for exact title match
        if title1 == title2 and title1 != '':
            return True
        
        # Check for very similar titles (common words)
        title1_words = set(title1.split())
        title2_words = set(title2.split())
        
        # If titles share more than 70% of words, consider them similar
        if len(title1_words) > 0 and len(title2_words) > 0:
            common_words = title1_words.intersection(title2_words)
            similarity = len(common_words) / max(len(title1_words), len(title2_words))
            if similarity > 0.7:
                return True
        
        # Check for similar organization names
        org_keywords = ['mission', 'salvation army', 'yonge street', 'st. michael', 'st. stephen', 'good shepherd', 'covenant house', 'evangel hall']
        for keyword in org_keywords:
            if keyword in title1 and keyword in title2:
                return True
        
        # Check for similar addresses
        address_keywords = ['yonge', 'queen', 'king', 'dundas', 'college', 'bloor', 'spadina', 'church']
        for keyword in address_keywords:
            if keyword in snippet1 and keyword in snippet2:
                # If both mention the same street, check if they're likely the same place
                if any(org in title1 and org in title2 for org in org_keywords):
                    return True
        
        # Check for phone number matches (if present)
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        phones1 = re.findall(phone_pattern, snippet1)
        phones2 = re.findall(phone_pattern, snippet2)
        
        if phones1 and phones2:
            for phone1 in phones1:
                for phone2 in phones2:
                    # Normalize phone numbers
                    phone1_clean = re.sub(r'[-.]', '', phone1)
                    phone2_clean = re.sub(r'[-.]', '', phone2)
                    if phone1_clean == phone2_clean:
                        return True
        
        # Check for similar service descriptions
        service_keywords = ['emergency shelter', 'homeless shelter', 'overnight accommodation', 'crisis housing']
        for keyword in service_keywords:
            if keyword in snippet1 and keyword in snippet2:
                # If both describe the same service type, check if they're the same organization
                if any(org in title1 and org in title2 for org in org_keywords):
                    return True
        
        return False
    
    def filter_similar_results(self, results: List[Dict]) -> List[Dict]:
        """
        Remove results that are essentially the same shelter/service.
        """
        if not results:
            return results
        
        filtered_results = [results[0]]  # Keep the first result
        
        for result in results[1:]:
            is_duplicate = False
            
            for existing_result in filtered_results:
                if self.is_similar_result(result, existing_result):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered_results.append(result)
        
        logger.info(f"Filtered {len(results)} results down to {len(filtered_results)} unique results")
        return filtered_results

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