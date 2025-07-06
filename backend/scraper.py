#!/usr/bin/env python3

## Scrape Program

"""
Resource Finder - Homeless Services Locator (Backend Integration)

A comprehensive tool that finds nearby homeless shelters and services based on user location
and specific service needs. Integrates multiple APIs for accurate, relevant results.

Modified for Node.js backend integration.

Author: AI Assistant
Date: 2024
"""

import os
import json
import requests
import pandas as pd
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import time
import re
from urllib.parse import urlparse
import logging
import argparse
import sys

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not available. Set environment variables manually.")

# Optional imports for distance calculation
try:
    from geopy.distance import geodesic
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False
    print("Warning: geopy not available. Distance calculations will use Google Maps API only.")

# Optional OpenAI integration
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai library not available. LLM features will be disabled.")

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
    Main class for finding homeless services and resources based on location and needs.
    """
    
    def __init__(self, serper_api_key: str, openai_api_key: Optional[str] = None):
        """
        Initialize the ResourceFinder with API keys.
        
        Args:
            serper_api_key: Serper.dev API key for web search
            openai_api_key: OpenAI API key for LLM features (optional)
        """
        self.serper_api_key = serper_api_key
        self.openai_api_key = openai_api_key
        
        # Available services
        self.available_services = {
            'showers': ['shower', 'bathroom', 'hygiene', 'clean'],
            'meals': ['meal', 'food', 'dinner', 'lunch', 'breakfast', 'nutrition'],
            'mental_health': ['mental health', 'counseling', 'therapy', 'psychiatrist', 'psychologist'],
            'medical': ['doctor', 'medical', 'healthcare', 'clinic', 'hospital'],
            'laundry': ['laundry', 'washing', 'clothes'],
            'wifi': ['wifi', 'internet', 'computer', 'technology', 'public access']
        }
        
        # Initialize OpenAI if available
        if openai_api_key and OPENAI_AVAILABLE:
            openai.api_key = openai_api_key
            self.llm_enabled = True
        else:
            self.llm_enabled = False
            logger.info("LLM features disabled - OpenAI API key not provided or library not available")
    
    def get_coordinates(self, location: str) -> Tuple[float, float]:
        """
        Convert location string to coordinates using Nominatim (OpenStreetMap).
        This is a free geocoding service that works well with Leaflet.
        
        Args:
            location: Address, city, or postal code
            
        Returns:
            Tuple of (latitude, longitude)
            
        Raises:
            Exception: If geocoding fails
        """
        # Check if it's a Canadian postal code first
        if re.match(r'^[A-Z]\d[A-Z]\s?\d[A-Z]\s?\d$', location, re.IGNORECASE):
            clean_postal = location.replace(' ', '').upper()
            
            # Try with explicit Canada context first
            try:
                url = "https://nominatim.openstreetmap.org/search"
                params = {
                    'q': f"{clean_postal}, Canada",
                    'format': 'json',
                    'limit': 1,
                    'addressdetails': 1,
                    'countrycodes': 'ca'
                }
                
                headers = {
                    'User-Agent': 'ResourceFinder/1.0 (homeless services locator)'
                }
                
                response = requests.get(url, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                if data:
                    result = data[0]
                    lat = float(result['lat'])
                    lng = float(result['lon'])
                    
                    # Verify it's actually in Canada (latitude should be positive for Canada)
                    if lat > 0 and -141 < lng < -52:
                        logger.info(f"Geocoded '{location}' to coordinates: ({lat}, {lng}) with Canada context")
                        return lat, lng
                
            except Exception as e:
                logger.warning(f"Geocoding with Canada context failed: {e}")
            
            # Try different Canadian postal code formats
            search_queries = [
                f"{clean_postal[:3]} {clean_postal[3:]}, Canada",
                f"{clean_postal[:3]}-{clean_postal[3:]}, Canada",
                f"postal code {clean_postal}, Canada",
                f"{clean_postal}, Toronto, Canada",
                f"{clean_postal}, Ontario, Canada"
            ]
            
            for query in search_queries:
                try:
                    url = "https://nominatim.openstreetmap.org/search"
                    params = {
                        'q': query,
                        'format': 'json',
                        'limit': 1,
                        'addressdetails': 1,
                        'countrycodes': 'ca'
                    }
                    
                    headers = {
                        'User-Agent': 'ResourceFinder/1.0 (homeless services locator)'
                    }
                    
                    response = requests.get(url, params=params, headers=headers)
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    if data:
                        result = data[0]
                        lat = float(result['lat'])
                        lng = float(result['lon'])
                        
                        # Verify it's actually in Canada
                        if lat > 0 and -141 < lng < -52:
                            logger.info(f"Geocoded '{location}' to coordinates: ({lat}, {lng}) using query: {query}")
                            return lat, lng
                    
                except Exception as e:
                    logger.warning(f"Geocoding failed for query '{query}': {e}")
                    continue
        
        # For non-postal codes, try with Canada bias first
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': f"{location}, Canada",
                'format': 'json',
                'limit': 1,
                'addressdetails': 1,
                'countrycodes': 'ca'
            }
            
            headers = {
                'User-Agent': 'ResourceFinder/1.0 (homeless services locator)'
            }
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data:
                result = data[0]
                lat = float(result['lat'])
                lng = float(result['lon'])
                
                # Verify it's actually in Canada
                if lat > 0 and -141 < lng < -52:
                    logger.info(f"Geocoded '{location}' to coordinates: ({lat}, {lng}) with Canada bias")
                    return lat, lng
            
        except Exception as e:
            logger.warning(f"Geocoding with Canada bias failed: {e}")
        
        # Fallback: use known coordinates for common locations
        known_locations = {
            'toronto': (43.6532, -79.3832),
            'vancouver': (49.2827, -123.1207),
            'montreal': (45.5017, -73.5673),
            'calgary': (51.0447, -114.0719),
            'ottawa': (45.4215, -75.6972),
            'edmonton': (53.5461, -113.4938),
            'winnipeg': (49.8951, -97.1384),
            'quebec': (46.8139, -71.2080),
            'hamilton': (43.2557, -79.8711),
            'kitchener': (43.4516, -80.4925),
            'london': (42.9849, -81.2453),
            'victoria': (48.4284, -123.3656),
            'windsor': (42.3149, -83.0364),
            'saskatoon': (52.1332, -106.6700),
            'regina': (50.4452, -104.6189),
            'st. johns': (47.5615, -52.7126),
            'halifax': (44.6488, -63.5752),
            'saint john': (45.2733, -66.0633),
            'fredericton': (45.9636, -66.6431),
            'charlottetown': (46.2382, -63.1311),
            'whitehorse': (60.7212, -135.0568),
            'yellowknife': (62.4540, -114.3718),
            'iqaluit': (63.7467, -68.5170)
        }
        
        location_lower = location.lower().strip()
        for known_name, coords in known_locations.items():
            if known_name in location_lower:
                logger.info(f"Using known coordinates for '{location}': {coords}")
                return coords
        
        # Final fallback: try with US bias but prefer Canada
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': location,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': 'ResourceFinder/1.0 (homeless services locator)'
            }
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data:
                result = data[0]
                lat = float(result['lat'])
                lng = float(result['lon'])
                
                logger.info(f"Geocoded '{location}' to coordinates: ({lat}, {lng}) with fallback")
                return lat, lng
            
        except Exception as e:
            logger.warning(f"Final geocoding attempt failed: {e}")
        
        raise Exception(f"No results found for location: {location} after trying multiple search strategies")
    
    def search_services(self, location: str, selected_services: List[str]) -> List[Dict]:
        """
        Search for services using Serper.dev API with broader area search.
        
        Args:
            location: User's location
            selected_services: List of service types to search for
            
        Returns:
            List of search results
        """
        all_results = []
        
        # First, get coordinates for the location to understand the area
        try:
            user_coords = self.get_coordinates(location)
            logger.info(f"Searching around coordinates: {user_coords}")
        except Exception as e:
            logger.warning(f"Could not geocode location, using location string: {e}")
            user_coords = None
        
        # Create multiple search strategies
        search_queries = []
        
        # Strategy 1: Direct service searches in the area
        for service in selected_services:
            if service not in self.available_services:
                continue
            
            # Multiple query variations for better coverage
            queries = [
                f"homeless shelter {service} services near {location}",
                f"{service} homeless shelter {location}",
                f"homeless services {service} {location}",
                f"shelter {service} {location}"
            ]
            search_queries.extend(queries)
        
        # Strategy 2: General homeless shelter searches in the area
        general_queries = [
            f"homeless shelters near {location}",
            f"homeless services {location}",
            f"shelters {location}",
            f"homeless assistance {location}",
            f"homeless support {location}"
        ]
        search_queries.extend(general_queries)
        
        # Strategy 3: If we have coordinates, search in broader area
        if user_coords and location:
            # Search in a 20km radius with different city names
            nearby_queries = [
                f"homeless shelters within 20km of {location}",
                f"homeless services near {location}",
                f"homeless shelters {location} area"
            ]
            search_queries.extend(nearby_queries)
        
        # Remove duplicates while preserving order
        seen_queries = set()
        unique_queries = []
        for query in search_queries:
            if query not in seen_queries:
                seen_queries.add(query)
                unique_queries.append(query)
        
        logger.info(f"Executing {len(unique_queries)} search queries")
        
        # Execute searches
        for i, query in enumerate(unique_queries):
            try:
                url = "https://google.serper.dev/search"
                headers = {
                    'X-API-KEY': self.serper_api_key,
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    'q': query,
                    'num': 15,  # Get more results per query
                    'gl': 'ca',  # Always use Canada bias
                    'hl': 'en-ca'  # Canadian English
                }
                
                response = requests.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                
                if 'organic' in data:
                    for result in data['organic']:
                        # Add query context to result
                        result['search_query'] = query
                        result['query_index'] = i
                        all_results.append(result)
                
                logger.info(f"Query {i+1}/{len(unique_queries)}: Found {len(data.get('organic', []))} results")
                
                # Rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Search error for query '{query}': {e}")
                continue
        
        # Remove duplicate URLs while preserving order
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
        
        Args:
            text: Text to search in
            selected_services: List of service types to check for
            
        Returns:
            List of matching services
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
        
        return list(set(matching_services))  # Remove duplicates
    
    def calculate_distance(self, user_coords: Tuple[float, float], result_address: str) -> Optional[float]:
        """
        Calculate distance between user location and result address using geopy.
        
        Args:
            user_coords: User's (lat, lng)
            result_address: Address of the service
            
        Returns:
            Distance in kilometers, or None if calculation fails
        """
        try:
            # First try to geocode the result address
            result_coords = self.get_coordinates(result_address)
            
            if GEOPY_AVAILABLE:
                # Use geopy for distance calculation
                distance = geodesic(user_coords, result_coords).kilometers
                return round(distance, 2)
            else:
                # Fallback: simple Euclidean distance (less accurate but no API needed)
                import math
                lat1, lon1 = user_coords
                lat2, lon2 = result_coords
                
                # Convert to radians
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                
                # Haversine formula
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distance = 6371 * c  # Earth's radius in km
                
                return round(distance, 2)
            
        except Exception as e:
            logger.warning(f"Distance calculation failed: {e}")
            return None
    
    def extract_address_from_url(self, url: str) -> Optional[str]:
        """
        Try to extract address information from URL or domain.
        
        Args:
            url: URL to extract address from
            
        Returns:
            Extracted address or None
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            
            # Common patterns for shelter websites
            if any(keyword in domain.lower() for keyword in ['shelter', 'mission', 'rescue', 'center']):
                return domain
            
            return None
            
        except Exception:
            return None
    
    def scrape_shelter_details(self, url: str) -> Dict[str, any]:
        """
        Intelligent scraping with context-aware information extraction.
        
        Args:
            url: URL of the shelter website
            
        Returns:
            Dictionary with detailed shelter information
        """
        try:
            headers = {
                'User-Agent': 'ResourceFinder/1.0 (homeless services locator)'
            }
            
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            html_content = response.text.lower()
            
            # Intelligent service extraction with context
            services_found = self._extract_services_intelligently(html_content)
            
            # Smart address extraction with validation
            address = self._extract_address_intelligently(html_content)
            
            # Enhanced contact information extraction
            contact_info = self._extract_contact_intelligently(html_content)
            
            # Intelligent hours extraction
            hours = self._extract_hours_intelligently(html_content)
            
            # Extract additional contextual information
            additional_info = self._extract_contextual_info(html_content)
            
            return {
                'services': list(services_found.keys()),
                'address': address,
                'phone': contact_info.get('phone'),
                'email': contact_info.get('email'),
                'hours': hours,
                'capacity': additional_info.get('capacity'),
                'eligibility': additional_info.get('eligibility'),
                'special_programs': additional_info.get('special_programs'),
                'accessibility': additional_info.get('accessibility'),
                'url': url
            }
            
        except Exception as e:
            logger.warning(f"Failed to scrape {url}: {e}")
            return {'services': [], 'url': url}
    
    def _extract_services_intelligently(self, html_content: str) -> Dict[str, bool]:
        """
        Intelligent service extraction with context awareness.
        """
        services_found = {}
        
        # Enhanced service keywords with context
        service_contexts = {
            'meals': {
                'keywords': ['meal', 'food', 'dinner', 'lunch', 'breakfast', 'nutrition', 'feeding'],
                'context_indicators': ['daily', 'three times', 'hot meal', 'nutritious', 'free meal'],
                'negative_indicators': ['meal plan', 'meal prep', 'meal delivery service']
            },
            'showers': {
                'keywords': ['shower', 'bathroom', 'hygiene', 'clean', 'washing'],
                'context_indicators': ['shower facilities', 'hygiene services', 'clean facilities'],
                'negative_indicators': ['shower head', 'shower curtain', 'shower gel']
            },
            'mental_health': {
                'keywords': ['mental health', 'counseling', 'therapy', 'psychiatrist', 'psychologist'],
                'context_indicators': ['mental health services', 'counseling available', 'therapy sessions'],
                'negative_indicators': ['mental health awareness', 'mental health month']
            },
            'medical': {
                'keywords': ['doctor', 'medical', 'healthcare', 'clinic', 'hospital'],
                'context_indicators': ['medical services', 'healthcare provider', 'clinic services'],
                'negative_indicators': ['medical supplies', 'medical equipment']
            },
            'laundry': {
                'keywords': ['laundry', 'washing', 'clothes'],
                'context_indicators': ['laundry services', 'washing facilities', 'clean clothes'],
                'negative_indicators': ['laundry detergent', 'laundry basket']
            },
            'wifi': {
                'keywords': ['wifi', 'internet', 'computer', 'technology'],
                'context_indicators': ['free wifi', 'internet access', 'computer lab'],
                'negative_indicators': ['wifi router', 'wifi password']
            }
        }
        
        for service, config in service_contexts.items():
            # Check for positive keywords
            keyword_found = any(keyword in html_content for keyword in config['keywords'])
            
            if keyword_found:
                # Check for positive context indicators
                context_positive = any(indicator in html_content for indicator in config['context_indicators'])
                
                # Check for negative context indicators
                context_negative = any(indicator in html_content for indicator in config['negative_indicators'])
                
                # Only mark as found if positive context outweighs negative
                if context_positive or (keyword_found and not context_negative):
                    services_found[service] = True
        
        return services_found
    
    def _extract_address_intelligently(self, html_content: str) -> Optional[str]:
        """
        Smart address extraction with validation and cleaning.
        """
        # Enhanced address patterns with context
        address_patterns = [
            # Structured address patterns
            r'address[:\s]+([^<>\n]{10,100})',
            r'location[:\s]+([^<>\n]{10,100})',
            r'(\d+\s+[a-zA-Z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)[^<>\n]{0,50})',
            r'([a-zA-Z\s]+,?\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?)',
            # Canadian postal code pattern
            r'([A-Z]\d[A-Z]\s?\d[A-Z]\s?\d)',
            # Street address with city/state
            r'(\d+\s+[a-zA-Z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)[^<>\n]*?(?:[A-Z][a-z]+\s*,\s*[A-Z]{2}))'
        ]
        
        for pattern in address_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                address = match.strip()
                # Validate address quality
                if self._validate_address_quality(address):
                    return address
        
        return None
    
    def _validate_address_quality(self, address: str) -> bool:
        """
        Validate if extracted address is likely to be real.
        """
        if not address or len(address) < 10:
            return False
        
        # Check for common address components
        has_street_number = bool(re.search(r'\d+', address))
        has_street_name = bool(re.search(r'(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)', address, re.IGNORECASE))
        has_city_state = bool(re.search(r'[A-Z][a-z]+\s*,\s*[A-Z]{2}', address))
        
        # Must have at least 2 of these components
        components = sum([has_street_number, has_street_name, has_city_state])
        return components >= 2
    
    def _extract_contact_intelligently(self, html_content: str) -> Dict[str, Optional[str]]:
        """
        Smart contact information extraction.
        """
        contact_info = {}
        
        # Enhanced phone patterns
        phone_patterns = [
            r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})',
            r'(\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4})',
            r'(\(\d{3}\)\s*\d{3}[-.\s]?\d{4})'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, html_content)
            if match:
                contact_info['phone'] = match.group(1)
                break
        
        # Email extraction
        email_pattern = r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
        email_match = re.search(email_pattern, html_content)
        if email_match:
            contact_info['email'] = email_match.group(1)
        
        return contact_info
    
    def _extract_hours_intelligently(self, html_content: str) -> Optional[str]:
        """
        Intelligent hours extraction with context.
        """
        hours_patterns = [
            r'hours[:\s]+([^<>\n]{10,100})',
            r'open[:\s]+([^<>\n]{10,100})',
            r'operating hours[:\s]+([^<>\n]{10,100})',
            r'(\d{1,2}:\d{2}\s*(?:am|pm)\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm))',
            r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^<>\n]*?(\d{1,2}:\d{2})'
        ]
        
        for pattern in hours_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                hours = match.group(1).strip()
                # Clean up the hours text
                hours = re.sub(r'\s+', ' ', hours)
                if len(hours) > 5:  # Must be substantial
                    return hours
        
        return None
    
    def _extract_contextual_info(self, html_content: str) -> Dict[str, any]:
        """
        Extract additional contextual information.
        """
        contextual_info = {}
        
        # Capacity information
        capacity_patterns = [
            r'capacity[:\s]+([^<>\n]+)',
            r'(\d+)\s*(?:beds?|spots?|spaces?)',
            r'can accommodate[^<>\n]*?(\d+)'
        ]
        
        for pattern in capacity_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                contextual_info['capacity'] = match.group(1).strip()
                break
        
        # Eligibility requirements
        eligibility_patterns = [
            r'eligibility[:\s]+([^<>\n]+)',
            r'requirements[:\s]+([^<>\n]+)',
            r'must be[^<>\n]+',
            r'age[^<>\n]*?(\d+)'
        ]
        
        for pattern in eligibility_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                contextual_info['eligibility'] = match.group(1).strip()
                break
        
        # Special programs
        program_keywords = ['veterans', 'lgbtq', 'women', 'families', 'youth', 'addiction', 'recovery']
        special_programs = []
        for keyword in program_keywords:
            if keyword in html_content:
                special_programs.append(keyword)
        
        if special_programs:
            contextual_info['special_programs'] = special_programs
        
        # Accessibility features
        accessibility_keywords = ['wheelchair', 'accessible', 'ada', 'disability', 'ramp']
        accessibility_features = []
        for keyword in accessibility_keywords:
            if keyword in html_content:
                accessibility_features.append(keyword)
        
        if accessibility_features:
            contextual_info['accessibility'] = accessibility_features
        
        return contextual_info
    
    def enhance_results_with_details(self, results: List[Dict]) -> List[Dict]:
        """
        Enhance search results with intelligent information extraction from shelter websites.
        
        Args:
            results: List of search results
            
        Returns:
            Enhanced results with detailed information
        """
        enhanced_results = []
        
        for result in results:
            url = result.get('link', '')
            if not url:
                continue
            
            # Intelligent website classification
            if not self._is_likely_shelter_website(url, result.get('title', ''), result.get('snippet', '')):
                continue
            
            try:
                details = self.scrape_shelter_details(url)
                result['detailed_services'] = details.get('services', [])
                result['address'] = details.get('address')
                result['phone'] = details.get('phone')
                result['email'] = details.get('email')
                result['hours'] = details.get('hours')
                result['capacity'] = details.get('capacity')
                result['eligibility'] = details.get('eligibility')
                result['special_programs'] = details.get('special_programs')
                result['accessibility'] = details.get('accessibility')
                
                # Add intelligent content analysis
                result['content_quality_score'] = self._analyze_content_quality(result)
                result['service_completeness'] = self._calculate_service_completeness(details)
                
                enhanced_results.append(result)
                
                logger.info(f"Enhanced result: {result.get('title', 'Unknown')} - Services: {details.get('services', [])} - Quality: {result.get('content_quality_score', 0)}")
                
            except Exception as e:
                logger.warning(f"Failed to enhance result {url}: {e}")
                enhanced_results.append(result)
        
        return enhanced_results
    
    def _is_likely_shelter_website(self, url: str, title: str, snippet: str) -> bool:
        """
        Intelligent classification to determine if a website is likely a shelter.
        """
        text_to_analyze = f"{url} {title} {snippet}".lower()
        
        # Positive indicators
        positive_keywords = [
            'shelter', 'mission', 'rescue', 'homeless', 'housing', 'assistance',
            'support', 'help', 'services', 'center', 'organization', 'charity'
        ]
        
        # Negative indicators (commercial/irrelevant)
        negative_keywords = [
            'hotel', 'resort', 'vacation', 'booking', 'travel', 'shopping',
            'restaurant', 'food delivery', 'real estate', 'property'
        ]
        
        positive_score = sum(1 for keyword in positive_keywords if keyword in text_to_analyze)
        negative_score = sum(1 for keyword in negative_keywords if keyword in text_to_analyze)
        
        # Must have more positive than negative indicators
        return positive_score > negative_score
    
    def _analyze_content_quality(self, result: Dict) -> float:
        """
        Analyze the quality and completeness of the content.
        """
        quality_score = 0.0
        
        # Check for comprehensive information
        if result.get('address'):
            quality_score += 0.2
        if result.get('phone'):
            quality_score += 0.15
        if result.get('email'):
            quality_score += 0.1
        if result.get('hours'):
            quality_score += 0.15
        if result.get('capacity'):
            quality_score += 0.1
        if result.get('eligibility'):
            quality_score += 0.1
        if result.get('special_programs'):
            quality_score += 0.1
        if result.get('accessibility'):
            quality_score += 0.1
        
        # Bonus for comprehensive service information
        services = result.get('detailed_services', [])
        if len(services) >= 3:
            quality_score += 0.1
        
        return min(quality_score, 1.0)
    
    def _calculate_service_completeness(self, details: Dict) -> float:
        """
        Calculate how complete the service information is.
        """
        total_services = len(self.available_services)
        found_services = len(details.get('services', []))
        
        return found_services / total_services if total_services > 0 else 0.0
    
    def analyze_with_llm(self, result: Dict, selected_services: List[str]) -> Tuple[Optional[str], Optional[float]]:
        """
        Use OpenAI LLM to analyze and score a search result.
        
        Args:
            result: Search result dictionary
            selected_services: List of services user is looking for
            
        Returns:
            Tuple of (summary, score)
        """
        if not self.llm_enabled:
            return None, None
        
        try:
            prompt = f"""
            Analyze this homeless shelter/service result and provide:
            1. A brief summary of what services they offer
            2. A score from 1-10 on how well it matches these needs: {', '.join(selected_services)}
            
            Result:
            Title: {result.get('title', 'N/A')}
            URL: {result.get('link', 'N/A')}
            Snippet: {result.get('snippet', 'N/A')}
            
            Respond in JSON format:
            {{"summary": "brief summary", "score": number}}
            """
            
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                if content:
                    parsed = json.loads(content)
                    summary = parsed.get('summary')
                    score = float(parsed.get('score', 0))
                    return summary, score
                else:
                    return None, None
            except json.JSONDecodeError:
                # Fallback: extract summary from text
                return content[:200] if content else None, 5.0
                
        except Exception as e:
            logger.warning(f"LLM analysis failed: {e}")
            return None, None
    
    def find_resources(self, location: str, selected_services: List[str], 
                      use_llm: bool = False, enhance_with_scraping: bool = True) -> List[ServiceResult]:
        """
        Find homeless services and resources based on location and needs (optimized version).
        
        Args:
            location: User's location (address, city, postal code)
            selected_services: List of service types needed
            use_llm: Whether to use LLM analysis (optional)
            enhance_with_scraping: Whether to enhance with website scraping
            
        Returns:
            List of ServiceResult objects
        """
        logger.info(f"Starting resource search for location: {location}")
        logger.info(f"Selected services: {selected_services}")
        
        # Step 1: Get coordinates
        try:
            user_coords = self.get_coordinates(location)
            logger.info(f"User coordinates: {user_coords}")
        except Exception as e:
            logger.error(f"Failed to get coordinates: {e}")
            return []
        
        # Step 2: Search for services with optimized strategy
        search_results = self.search_services(location, selected_services)
        
        if not search_results:
            logger.warning("No search results found")
            return []
        
        logger.info(f"Found {len(search_results)} initial search results")
        
        # Step 3: Enhance results with detailed scraping (optional, limited)
        if enhance_with_scraping:
            logger.info("Enhancing results with detailed website scraping...")
            search_results = self.enhance_results_with_details(search_results)
        
        # Step 4: Process and filter results (limit to top 20 for performance)
        processed_results = []
        max_results = 20  # Limit results for performance
        
        for i, result in enumerate(search_results[:max_results]):
            # Extract text for keyword matching
            text_to_analyze = f"{result.get('title', '')} {result.get('snippet', '')}"
            
            # Use detailed services if available, otherwise match keywords
            if 'detailed_services' in result and result['detailed_services']:
                matching_services = result['detailed_services']
                logger.info(f"Using detailed services for {result.get('title', 'Unknown')}: {matching_services}")
            else:
                matching_services = self.match_keywords(text_to_analyze, selected_services)
            
            # Check if any of the user's selected services are provided
            if not any(service in matching_services for service in selected_services):
                continue  # Skip results that don't provide any requested services
            
            # Calculate distance only for top results to save time
            distance = None
            if i < 10:  # Only calculate distance for top 10 results
                address = result.get('address') or self.extract_address_from_url(result.get('link', ''))
                if address and user_coords:
                    try:
                        distance = self.calculate_distance(user_coords, address)
                    except Exception as e:
                        logger.warning(f"Distance calculation failed for {address}: {e}")
            
            # Calculate match score based on service overlap
            service_overlap = len(set(matching_services) & set(selected_services))
            match_score = service_overlap / len(selected_services)
            
            # LLM analysis (optional)
            llm_summary = None
            llm_score = None
            if use_llm and self.llm_enabled and i < 5:  # Only for top 5 results
                llm_summary, llm_score = self.analyze_with_llm(result, selected_services)
                if llm_score:
                    match_score = (match_score + llm_score / 10) / 2  # Combine scores
            
            # Create ServiceResult
            service_result = ServiceResult(
                name=result.get('title', 'Unknown'),
                url=result.get('link', ''),
                snippet=result.get('snippet', ''),
                matching_services=matching_services,
                distance_km=distance,
                match_score=match_score,
                llm_summary=llm_summary,
                llm_score=llm_score,
                address=result.get('address'),
                phone=result.get('phone'),
                hours=result.get('hours')
            )
            
            processed_results.append(service_result)
        
        # Step 5: Sort results by relevance and distance
        processed_results.sort(key=lambda x: (-x.match_score, x.distance_km or float('inf')))
        
        # Step 6: Limit to 5-10 best results
        max_results = min(10, max(5, len(processed_results)))
        processed_results = processed_results[:max_results]
        
        logger.info(f"Found {len(processed_results)} relevant results after filtering")
        return processed_results
    
    def print_results(self, results: List[ServiceResult]):
        """
        Print results in a formatted way.
        
        Args:
            results: List of ServiceResult objects
        """
        if not results:
            print("No relevant services found.")
            return
        
        print(f"\n{'='*60}")
        print(f"RESOURCE FINDER RESULTS")
        print(f"{'='*60}")
        print(f"Found {len(results)} relevant services\n")
        
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.name}")
            print(f"   URL: {result.url}")
            print(f"   Services: {', '.join(result.matching_services)}")
            print(f"   Match Score: {result.match_score:.2f}")
            
            if result.distance_km:
                print(f"   Distance: {result.distance_km} km")
            
            if result.llm_summary:
                print(f"   Summary: {result.llm_summary}")
            
            # Show enhanced information if available
            if hasattr(result, 'address') and result.address:
                print(f"   Address: {result.address}")
            if hasattr(result, 'phone') and result.phone:
                print(f"   Phone: {result.phone}")
            if hasattr(result, 'hours') and result.hours:
                print(f"   Hours: {result.hours}")
            
            print(f"   Snippet: {result.snippet[:150]}...")
            print("-" * 60)
    
    def save_results(self, results: List[ServiceResult], filename: str = None):
        """
        Save results to JSON file.
        
        Args:
            results: List of ServiceResult objects
            filename: Output filename (optional)
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"resource_results_{timestamp}.json"
        
        data = []
        for result in results:
            data.append({
                'name': result.name,
                'url': result.url,
                'snippet': result.snippet,
                'matching_services': result.matching_services,
                'distance_km': result.distance_km,
                'match_score': result.match_score,
                'llm_summary': result.llm_summary,
                'llm_score': result.llm_score
            })
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Results saved to {filename}")

def main():
    """
    Main function for CLI usage with Node.js integration.
    """
    # Check command line arguments
    if len(sys.argv) < 3:
        print("Usage: python3 scraper.py <location> <services> [use_llm] [enhance_scraping]")
        sys.exit(1)
    
    location = sys.argv[1]
    services_str = sys.argv[2]
    use_llm = len(sys.argv) > 3 and sys.argv[3].lower() == 'true'
    enhance_scraping = len(sys.argv) > 4 and sys.argv[4].lower() == 'true'
    
    # Parse services
    selected_services = services_str.split(',')
    
    # Load API keys from environment variables
    serper_api_key = os.getenv('SERPER_API_KEY')
    openai_api_key = os.getenv('OPENAI_API_KEY')
    
    if not serper_api_key:
        print("Error: Missing SERPER_API_KEY environment variable")
        sys.exit(1)
    
    # Initialize resource finder
    finder = ResourceFinder(serper_api_key, openai_api_key)
    
    # Find resources
    logger.info(f"Searching for services in {location}...")
    results = finder.find_resources(location, selected_services, use_llm, enhance_scraping)
    
    # Convert results to JSON-serializable format
    json_results = []
    for result in results:
        json_result = asdict(result)
        json_results.append(json_result)
    
    # Output JSON to stdout for Node.js to capture
    print(json.dumps(json_results, indent=2))

if __name__ == "__main__":
    main() 