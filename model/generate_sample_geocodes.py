import pandas as pd
import json
import random

def generate_sample_geocodes():
    """Generate sample geocoded data for Toronto shelters"""
    
    # Load shelter data to get unique shelters
    df = pd.read_csv("../data/shelter_occupancy.csv")
    unique_shelters = df['FACILITY_NAME'].unique()
    
    # Toronto approximate boundaries
    # Latitude: 43.6532° N (43.5 to 43.8)
    # Longitude: 79.3832° W (-79.6 to -79.1)
    
    geocodes = []
    
    for i, shelter_name in enumerate(unique_shelters):
        # Generate coordinates within Toronto area
        lat = 43.5 + random.uniform(0, 0.3)  # 43.5 to 43.8
        lng = -79.6 + random.uniform(0, 0.5)  # -79.6 to -79.1
        
        # Get address from the data if available
        shelter_data = df[df['FACILITY_NAME'] == shelter_name]
        if not shelter_data.empty:
            address = shelter_data.iloc[0].get('ADDRESS', f'{shelter_name}, Toronto, ON')
        else:
            address = f'{shelter_name}, Toronto, ON'
        
        geocodes.append({
            'shelter_name': shelter_name,
            'address': address,
            'lat': round(lat, 6),
            'lng': round(lng, 6)
        })
    
    # Save to file
    with open('../data/shelter_geocodes.json', 'w') as f:
        json.dump(geocodes, f, indent=2)
    
    print(f"Generated {len(geocodes)} sample geocodes")
    print("Sample geocodes saved to: ../data/shelter_geocodes.json")

if __name__ == "__main__":
    generate_sample_geocodes() 