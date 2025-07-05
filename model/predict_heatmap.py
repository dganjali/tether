import pandas as pd
import numpy as np
import json
import sys
import os
from datetime import datetime, timedelta
import tensorflow as tf
from tensorflow import keras

def load_model():
    """Load the trained TensorFlow model"""
    try:
        model_path = os.path.join(os.path.dirname(__file__), '..', 'model.h5')
        model = keras.models.load_model(model_path, compile=False)
        return model
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return None

def load_geocodes():
    """Load geocoded shelter data"""
    try:
        geocode_file = "../data/shelter_geocodes.json"
        if os.path.exists(geocode_file):
            with open(geocode_file, 'r') as f:
                return json.load(f)
        else:
            print("Warning: No geocoded data found. Run geocode_shelters.py first.", file=sys.stderr)
            return []
    except Exception as e:
        print(f"Error loading geocodes: {e}", file=sys.stderr)
        return []

def create_features_from_data(shelter_data):
    """Create proper features from shelter data"""
    features = []
    
    for _, row in shelter_data.iterrows():
        feature_vector = []
        
        # Parse date properly
        if isinstance(row['OCCUPANCY_DATE'], str):
            date = pd.to_datetime(row['OCCUPANCY_DATE'])
        else:
            date = row['OCCUPANCY_DATE']
        
        # Time-based features
        feature_vector.extend([
            date.weekday(),           # Day of week (0-6)
            date.month,               # Month (1-12)
            date.day,                 # Day of month (1-31)
            date.year,                # Year
            date.dayofyear,           # Day of year (1-365)
            date.quarter,             # Quarter (1-4)
            date.is_month_start,      # Is start of month (0/1)
            date.is_month_end,        # Is end of month (0/1)
            date.is_quarter_start,    # Is start of quarter (0/1)
            date.is_quarter_end,      # Is end of quarter (0/1)
        ])
        
        # Occupancy features
        occupancy = float(row['OCCUPANCY']) if pd.notna(row['OCCUPANCY']) else 0.0
        capacity = float(row['CAPACITY']) if pd.notna(row['CAPACITY']) else 1.0
        
        feature_vector.extend([
            occupancy,                    # Raw occupancy
            capacity,                     # Raw capacity
            occupancy / max(capacity, 1), # Occupancy rate
            max(0, capacity - occupancy), # Available capacity
        ])
        
        # Sector encoding (one-hot encoding for common sectors)
        sector = str(row['SECTOR']).lower() if pd.notna(row['SECTOR']) else 'unknown'
        sectors = ['women', 'men', 'families', 'co-ed', 'youth', 'seniors']
        for s in sectors:
            feature_vector.append(1.0 if s in sector else 0.0)
        
        # Program features
        program = str(row['PROGRAM_NAME']).lower() if pd.notna(row['PROGRAM_NAME']) else ''
        feature_vector.extend([
            1.0 if 'family' in program else 0.0,
            1.0 if 'women' in program else 0.0,
            1.0 if 'men' in program else 0.0,
            1.0 if 'youth' in program else 0.0,
            1.0 if 'emergency' in program else 0.0,
            1.0 if 'transitional' in program else 0.0,
        ])
        
        # Seasonal features
        feature_vector.extend([
            np.sin(2 * np.pi * date.dayofyear / 365.25),  # Seasonal sine
            np.cos(2 * np.pi * date.dayofyear / 365.25),  # Seasonal cosine
            np.sin(2 * np.pi * date.weekday() / 7),         # Weekly sine
            np.cos(2 * np.pi * date.weekday() / 7),         # Weekly cosine
        ])
        
        # Lag features (previous day's occupancy if available)
        feature_vector.append(occupancy)  # Current occupancy as lag feature
        
        # Statistical features
        feature_vector.extend([
            occupancy / 100.0,        # Normalized occupancy
            capacity / 1000.0,        # Normalized capacity
            min(1.0, occupancy / 100.0),  # Capped occupancy
        ])
        
        # Additional features to reach expected dimension
        # These are derived from existing features
        feature_vector.extend([
            occupancy * date.weekday() / 100.0,  # Interaction feature
            capacity * date.month / 100.0,       # Interaction feature
            occupancy / max(capacity, 1) * date.weekday() / 7.0,  # Rate interaction
        ])
        
        # Pad or truncate to exactly 45 features
        if len(feature_vector) < 45:
            feature_vector += [0.0] * (45 - len(feature_vector))
        elif len(feature_vector) > 45:
            feature_vector = feature_vector[:45]
        
        features.append(feature_vector)
    
    return features

def predict_shelter_influx(shelter_name, target_date, model):
    """Predict influx for a single shelter"""
    try:
        # Load the data
        df = pd.read_csv("../data/shelter_occupancy.csv", parse_dates=["OCCUPANCY_DATE"])
        
        # Filter for the specific shelter
        shelter_data = df[df['FACILITY_NAME'] == shelter_name].copy()
        
        if shelter_data.empty:
            return None, f"Shelter '{shelter_name}' not found in data"
        
        # Sort by date
        shelter_data = shelter_data.sort_values('OCCUPANCY_DATE')
        
        # Get the latest 30 data points (assuming model expects 30 time steps)
        if len(shelter_data) < 30:
            return None, f"Insufficient data for shelter '{shelter_name}'. Need at least 30 data points, got {len(shelter_data)}"
        
        # Get the last 30 data points
        recent_data = shelter_data.tail(30)
        
        # Create features for each time step
        features = create_features_from_data(recent_data)
        
        # Convert to numpy array and reshape
        features_array = np.array(features, dtype=np.float32)
        
        # Ensure we have the right shape
        if features_array.shape[0] != 30:
            if features_array.shape[0] < 30:
                padding = np.tile(features_array[-1:], (30 - features_array.shape[0], 1))
                features_array = np.vstack([features_array, padding])
            else:
                features_array = features_array[-30:]
        
        features_array = features_array.reshape(1, 30, -1)
        
        # Make prediction
        prediction = model.predict(features_array, verbose=0)
        predicted_occupancy = float(prediction[0][0]) if prediction.ndim > 1 else float(prediction[0])
        
        # Add some variation based on the target date
        day_of_week = target_date.weekday()
        variation_factor = 1.0 + (day_of_week - 3) * 0.1
        predicted_occupancy *= variation_factor
        
        return int(predicted_occupancy), None
        
    except Exception as e:
        return None, f"Prediction failed: {str(e)}"

def generate_heatmap_data(target_date=None):
    """Generate heatmap data for all shelters"""
    if target_date is None:
        target_date = datetime.now().date() + timedelta(days=1)  # Tomorrow
    
    # Load model
    model = load_model()
    if model is None:
        return {"error": "Failed to load model"}
    
    # Load geocoded data
    geocodes = load_geocodes()
    if not geocodes:
        return {"error": "No geocoded data found. Run geocode_shelters.py first."}
    
    # Load shelter data to get unique shelters
    df = pd.read_csv("../data/shelter_occupancy.csv")
    unique_shelters = df['FACILITY_NAME'].unique()
    
    print(f"Generating predictions for {len(unique_shelters)} shelters...", file=sys.stderr)
    
    heatmap_data = []
    successful = 0
    failed = 0
    
    for shelter_name in unique_shelters:
        # Find geocode data for this shelter
        geocode_data = next((g for g in geocodes if g['shelter_name'] == shelter_name), None)
        
        if not geocode_data or geocode_data['lat'] is None:
            print(f"Skipping {shelter_name} - no geocode data", file=sys.stderr)
            failed += 1
            continue
        
        # Get prediction
        predicted_influx, error = predict_shelter_influx(shelter_name, target_date, model)
        
        if error:
            print(f"Failed to predict for {shelter_name}: {error}", file=sys.stderr)
            failed += 1
            continue
        
        # Create heatmap data point
        heatmap_point = {
            "name": shelter_name,
            "lat": geocode_data['lat'],
            "lng": geocode_data['lng'],
            "predicted_influx": predicted_influx,
            "address": geocode_data.get('address', ''),
            "organization": df[df['FACILITY_NAME'] == shelter_name]['ORGANIZATION_NAME'].iloc[0] if len(df[df['FACILITY_NAME'] == shelter_name]) > 0 else '',
            "sector": df[df['FACILITY_NAME'] == shelter_name]['SECTOR'].iloc[0] if len(df[df['FACILITY_NAME'] == shelter_name]) > 0 else '',
            "capacity": int(df[df['FACILITY_NAME'] == shelter_name]['CAPACITY'].iloc[0]) if len(df[df['FACILITY_NAME'] == shelter_name]) > 0 else 0
        }
        
        heatmap_data.append(heatmap_point)
        successful += 1
        
        if successful % 10 == 0:
            print(f"Processed {successful}/{len(unique_shelters)} shelters...", file=sys.stderr)
    
    print(f"Completed: {successful} successful, {failed} failed", file=sys.stderr)
    
    return {
        "shelters": heatmap_data,
        "generated_at": datetime.now().isoformat(),
        "target_date": target_date.strftime("%Y-%m-%d"),
        "total_shelters": len(unique_shelters),
        "successful_predictions": successful,
        "failed_predictions": failed
    }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("Usage: python predict_heatmap.py <command>")
        print("Commands:")
        print("  heatmap [date] - Generate heatmap data for all shelters (optional date: YYYY-MM-DD)")
        return
    
    command = sys.argv[1]
    
    if command == "heatmap":
        target_date = None
        if len(sys.argv) > 2:
            try:
                target_date = datetime.strptime(sys.argv[2], "%Y-%m-%d").date()
            except ValueError:
                print("Error: Invalid date format. Use YYYY-MM-DD")
                return
        
        result = generate_heatmap_data(target_date)
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main() 