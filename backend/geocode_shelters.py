import pandas as pd
import requests
import time
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def geocode_address(address, city="Toronto", province="ON"):
    """
    Geocode an address using Google Geocoding API
    """
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("Warning: GOOGLE_MAPS_API_KEY not found in environment variables")
        return None, None
    
    # Construct full address
    full_address = f"{address}, {city}, {province}, Canada"
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'address': full_address,
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['status'] == 'OK':
            location = data['results'][0]['geometry']['location']
            return location['lat'], location['lng']
        else:
            print(f"Geocoding failed for {full_address}: {data['status']}")
            return None, None
            
    except Exception as e:
        print(f"Error geocoding {full_address}: {e}")
        return None, None

def main():
    # Read the CSV file
    csv_path = '../data/shelter_locations.csv'
    df = pd.read_csv(csv_path)
    
    print(f"Geocoding {len(df)} shelter addresses...")
    print("This may take a few minutes due to API rate limits...")
    
    # Process each shelter
    for index, row in df.iterrows():
        shelter_name = row['name']
        address = row['address']
        city = row['city']
        province = row['province']
        
        print(f"Processing {index + 1}/{len(df)}: {shelter_name}")
        
        # Skip if address is the same as name (placeholder addresses)
        if address == shelter_name or address == 'Address not available':
            print(f"  Skipping {shelter_name} - no valid address")
            continue
        
        # Geocode the address
        lat, lng = geocode_address(address, city, province)
        
        if lat and lng:
            df.at[index, 'lat'] = lat
            df.at[index, 'lng'] = lng
            print(f"  ✅ {shelter_name}: ({lat}, {lng})")
        else:
            print(f"  ❌ {shelter_name}: Failed to geocode")
        
        # Rate limiting - wait between requests
        time.sleep(0.1)  # 100ms delay between requests
    
    # Save the updated CSV
    output_path = '../data/shelter_locations_geocoded.csv'
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Geocoding complete!")
    print(f"📁 Updated file saved to: {output_path}")
    
    # Print summary
    successful = df[df['lat'] != 43.6475].shape[0]  # Count non-default coordinates
    total = len(df)
    print(f"📊 Successfully geocoded: {successful}/{total} shelters")
    
    # Show some examples
    print("\n📍 Sample geocoded locations:")
    for index, row in df.head(5).iterrows():
        if row['lat'] != 43.6475:  # Only show successfully geocoded ones
            print(f"  {row['name']}: ({row['lat']}, {row['lng']})")

if __name__ == "__main__":
    main() 