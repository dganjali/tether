import pandas as pd
import json
import requests
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable

def geocode_address(address, city="Toronto", province="ON"):
    """
    Geocode an address using Nominatim (free geocoding service)
    """
    geolocator = Nominatim(user_agent="toronto_shelter_app")
    
    # Construct full address
    full_address = f"{address}, {city}, {province}, Canada"
    
    try:
        location = geolocator.geocode(full_address)
        if location:
            return {
                "lat": location.latitude,
                "lng": location.longitude
            }
        else:
            print(f"Could not geocode: {full_address}")
            return None
    except (GeocoderTimedOut, GeocoderUnavailable) as e:
        print(f"Geocoding error for {full_address}: {e}")
        return None

def main():
    # Read the CSV file
    print("Reading shelter occupancy data...")
    df = pd.read_csv('../data/shelter_occupancy.csv')
    
    # Get unique shelter addresses
    unique_shelters = df[['SHELTER_NAME', 'SHELTER_ADDRESS', 'SHELTER_CITY', 'SHELTER_PROVINCE']].drop_duplicates()
    
    print(f"Found {len(unique_shelters)} unique shelters")
    
    # Geocode each shelter
    shelters_with_coords = []
    
    for index, row in unique_shelters.iterrows():
        shelter_name = row['SHELTER_NAME']
        address = row['SHELTER_ADDRESS']
        city = row['SHELTER_CITY']
        province = row['SHELTER_PROVINCE']
        
        print(f"Geocoding: {shelter_name} - {address}")
        
        coords = geocode_address(address, city, province)
        
        if coords:
            shelters_with_coords.append({
                "name": shelter_name,
                "address": address,
                "city": city,
                "province": province,
                "lat": coords["lat"],
                "lng": coords["lng"]
            })
        
        # Add delay to respect rate limits
        time.sleep(1)
    
    # Save to JSON file
    output_file = '../data/shelter_locations.json'
    with open(output_file, 'w') as f:
        json.dump(shelters_with_coords, f, indent=2)
    
    print(f"Saved {len(shelters_with_coords)} shelter locations to {output_file}")

if __name__ == "__main__":
    main() 