import pandas as pd
import requests
import time
import json
import os
from datetime import datetime

def geocode_shelters():
    """Geocode all unique shelter addresses and save results"""
    
    # Load the shelter data
    df = pd.read_csv("../data/shelter_occupancy.csv")
    
    # Get unique addresses
    unique_addresses = df[['FACILITY_NAME', 'SHELTER_ADDRESS', 'SHELTER_CITY', 'SHELTER_PROVINCE', 'SHELTER_POSTAL_CODE']].drop_duplicates()
    
    print(f"Found {len(unique_addresses)} unique shelter addresses to geocode")
    
    # Check if we already have geocoded data
    geocode_file = "../data/shelter_geocodes.json"
    existing_geocodes = {}
    
    if os.path.exists(geocode_file):
        with open(geocode_file, 'r') as f:
            existing_geocodes = json.load(f)
        print(f"Found existing geocodes for {len(existing_geocodes)} shelters")
    
    results = []
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    
    if not api_key:
        print("Error: GOOGLE_MAPS_API_KEY environment variable not set")
        print("Please set your Google Maps API key:")
        print("export GOOGLE_MAPS_API_KEY='your_api_key_here'")
        return
    
    for idx, row in unique_addresses.iterrows():
        facility_name = row['FACILITY_NAME']
        
        # Check if we already have this shelter geocoded
        if facility_name in existing_geocodes:
            results.append(existing_geocodes[facility_name])
            print(f"Using cached geocode for: {facility_name}")
            continue
        
        # Build the address string
        address_parts = []
        if pd.notna(row['SHELTER_ADDRESS']):
            address_parts.append(str(row['SHELTER_ADDRESS']))
        if pd.notna(row['SHELTER_CITY']):
            address_parts.append(str(row['SHELTER_CITY']))
        if pd.notna(row['SHELTER_PROVINCE']):
            address_parts.append(str(row['SHELTER_PROVINCE']))
        if pd.notna(row['SHELTER_POSTAL_CODE']):
            address_parts.append(str(row['SHELTER_POSTAL_CODE']))
        
        address = ", ".join(address_parts)
        
        # Add "Canada" to improve geocoding accuracy
        full_address = f"{address}, Canada"
        
        print(f"Geocoding ({idx + 1}/{len(unique_addresses)}): {facility_name}")
        print(f"  Address: {full_address}")
        
        # Make geocoding request
        url = f"https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': full_address,
            'key': api_key
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                location = data['results'][0]['geometry']['location']
                result = {
                    'FACILITY_NAME': facility_name,
                    'lat': location['lat'],
                    'lng': location['lng'],
                    'address': full_address,
                    'geocoded_at': datetime.now().isoformat()
                }
                results.append(result)
                print(f"  ✓ Success: {location['lat']:.4f}, {location['lng']:.4f}")
            else:
                print(f"  ✗ Failed: {data['status']}")
                result = {
                    'FACILITY_NAME': facility_name,
                    'lat': None,
                    'lng': None,
                    'address': full_address,
                    'error': data['status'],
                    'geocoded_at': datetime.now().isoformat()
                }
                results.append(result)
            
            # Be nice to the API - don't exceed rate limits
            time.sleep(0.1)
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            result = {
                'FACILITY_NAME': facility_name,
                'lat': None,
                'lng': None,
                'address': full_address,
                'error': str(e),
                'geocoded_at': datetime.now().isoformat()
            }
            results.append(result)
    
    # Save results
    with open(geocode_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Also save as CSV for compatibility
    df_results = pd.DataFrame(results)
    df_results.to_csv("../data/shelter_geocodes.csv", index=False)
    
    # Print summary
    successful = sum(1 for r in results if r['lat'] is not None)
    failed = len(results) - successful
    
    print(f"\nGeocoding complete!")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Results saved to: {geocode_file}")

if __name__ == "__main__":
    geocode_shelters() 