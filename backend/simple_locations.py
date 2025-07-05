import pandas as pd
import json
import sys

def main():
    try:
        # Read the CSV file
        df = pd.read_csv('../data/shelter_locations_geocoded.csv')
        
        # Convert to JSON
        locations = df.to_dict('records')
        
        # Print JSON to stdout
        print(json.dumps(locations, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 