import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import warnings
import json
import os
warnings.filterwarnings('ignore')

def load_data():
    """Load the preprocessed shelter master data."""
    print("Loading preprocessed shelter data...")
    # Get the project root directory
    project_root = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(project_root, "data", "shelter_master.csv")
    df = pd.read_csv(data_path)
    df['OCCUPANCY_DATE'] = pd.to_datetime(df['OCCUPANCY_DATE'])
    print(f"Loaded {len(df)} records from {df['OCCUPANCY_DATE'].min()} to {df['OCCUPANCY_DATE'].max()}")
    return df

def create_date_features(df):
    """Create date-based features for modeling."""
    print("Creating date features...")
    
    # Extract date components
    df['day_of_week'] = df['OCCUPANCY_DATE'].dt.dayofweek
    df['month'] = df['OCCUPANCY_DATE'].dt.month
    df['year'] = df['OCCUPANCY_DATE'].dt.year
    df['day_of_year'] = df['OCCUPANCY_DATE'].dt.dayofyear
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Create seasonal features
    df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)
    df['is_summer'] = df['month'].isin([6, 7, 8]).astype(int)
    
    return df

def split_train_test(df):
    """Split data into train (before 2019) and test (2019) sets."""
    print("Splitting data into train/test sets...")
    
    train_mask = df['OCCUPANCY_DATE'] < '2019-01-01'
    train_df = df[train_mask].copy()
    test_df = df[~train_mask].copy()
    
    print(f"Train set: {len(train_df)} records ({train_df['OCCUPANCY_DATE'].min()} to {train_df['OCCUPANCY_DATE'].max()})")
    print(f"Test set: {len(test_df)} records ({test_df['OCCUPANCY_DATE'].min()} to {test_df['OCCUPANCY_DATE'].max()})")
    
    return train_df, test_df

def prepare_features(df):
    """Prepare feature columns for modeling."""
    # Select features for modeling
    feature_columns = [
        'OCCUPANCY_LAG_1', 'OCCUPANCY_LAG_7', 'OCCUPANCY_ROLLING_7',
        'OCCUPANCY_RATIO', 'CAPACITY',
        'day_of_week', 'month', 'year', 'day_of_year',
        'is_weekend', 'is_winter', 'is_summer'
    ]
    
    # Ensure all features exist
    missing_features = [col for col in feature_columns if col not in df.columns]
    if missing_features:
        print(f"Warning: Missing features: {missing_features}")
        feature_columns = [col for col in feature_columns if col in df.columns]
    
    return feature_columns

def train_model_for_shelter(train_data, test_data, shelter_name, program_name, feature_columns):
    """Train a Random Forest model for a specific shelter and program."""
    
    # Filter data for this shelter/program combination
    train_filtered = train_data[
        (train_data['SHELTER_NAME'] == shelter_name) & 
        (train_data['PROGRAM_NAME'] == program_name)
    ].copy()
    
    test_filtered = test_data[
        (test_data['SHELTER_NAME'] == shelter_name) & 
        (test_data['PROGRAM_NAME'] == program_name)
    ].copy()
    
    # Skip if insufficient data (need at least 10 days of training data and 5 days of test data)
    if len(train_filtered) < 10 or len(test_filtered) < 5:
        return None, None, None, None
    
    # Prepare features and target
    X_train = train_filtered[feature_columns].fillna(0)
    y_train = train_filtered['OCCUPANCY']
    
    X_test = test_filtered[feature_columns].fillna(0)
    y_test = test_filtered['OCCUPANCY']
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    
    return model, y_pred, rmse, mae

def generate_enhanced_recommendations(test_data, predictions, shelter_name, program_name, historical_data):
    """Generate enhanced recommendations with qualitative reasoning."""
    recommendations = []
    
    # Get capacity and historical data for this shelter/program
    shelter_data = test_data[
        (test_data['SHELTER_NAME'] == shelter_name) & 
        (test_data['PROGRAM_NAME'] == program_name)
    ]
    
    if len(shelter_data) == 0:
        return recommendations
    
    capacity = shelter_data['CAPACITY'].iloc[0]
    
    # Get historical patterns for this shelter
    historical_shelter_data = historical_data[
        (historical_data['SHELTER_NAME'] == shelter_name) & 
        (historical_data['PROGRAM_NAME'] == program_name)
    ]
    
    # Calculate historical statistics
    avg_occupancy = historical_shelter_data['OCCUPANCY'].mean() if len(historical_shelter_data) > 0 else 0
    max_occupancy = historical_shelter_data['OCCUPANCY'].max() if len(historical_shelter_data) > 0 else 0
    occupancy_volatility = historical_shelter_data['OCCUPANCY'].std() if len(historical_shelter_data) > 0 else 0
    
    # Calculate additional quantitative metrics for resource planning
    avg_daily_influx = historical_shelter_data['OCCUPANCY'].diff().mean() if len(historical_shelter_data) > 1 else 0
    max_daily_influx = historical_shelter_data['OCCUPANCY'].diff().max() if len(historical_shelter_data) > 1 else 0
    seasonal_peak_factor = max_occupancy / avg_occupancy if avg_occupancy > 0 else 1.0
    
    # Check for over-capacity predictions
    for i, pred in enumerate(predictions):
        if pred > capacity:
            date = shelter_data['OCCUPANCY_DATE'].iloc[i]
            excess = int(pred - capacity)
            
            # Determine severity level
            severity = "LOW" if excess <= 2 else "MEDIUM" if excess <= 5 else "HIGH"
            
            # Analyze seasonal patterns
            month = date.month
            is_winter = month in [12, 1, 2]
            is_summer = month in [6, 7, 8]
            
            # Generate contextual reasoning
            reasoning = []
            
            if is_winter:
                reasoning.append("Winter months typically see increased demand due to extreme weather conditions.")
            elif is_summer:
                reasoning.append("Summer months may have reduced demand but could indicate other factors.")
            
            if pred > max_occupancy * 1.1:
                reasoning.append("This prediction exceeds historical maximum occupancy by more than 10%.")
            elif pred > avg_occupancy * 1.2:
                reasoning.append("This prediction is significantly above average occupancy patterns.")
            
            if occupancy_volatility > avg_occupancy * 0.3:
                reasoning.append("This shelter shows high occupancy volatility, requiring flexible response strategies.")
            
            # Generate specific recommendations based on context
            if severity == "HIGH":
                action_items = [
                    "Immediate activation of emergency overflow protocols",
                    "Contact partner shelters for temporary bed arrangements",
                    "Consider opening temporary warming centers if weather-related"
                ]
            elif severity == "MEDIUM":
                action_items = [
                    "Increase staff coverage for the predicted period",
                    "Prepare overflow space if available",
                    "Monitor situation closely for escalation"
                ]
            else:  # LOW
                action_items = [
                    "Monitor occupancy trends closely",
                    "Prepare contingency plans if situation worsens"
                ]
            
            # Create enhanced message
            context = " ".join(reasoning) if reasoning else "Based on historical patterns and current trends."
            actions = "; ".join(action_items)
            
            enhanced_message = f"Shelter {shelter_name} ({program_name}) is expected to be over capacity by {excess} beds on {date.strftime('%Y-%m-%d')}. {context} Recommended actions: {actions}"
            
            recommendation = {
                'date': date,
                'predicted_occupancy': int(pred),
                'capacity': int(capacity),
                'excess': excess,
                'severity': severity,
                'reasoning': reasoning,
                'action_items': action_items,
                'shelter_name': shelter_name,
                'program_name': program_name,
                'message': enhanced_message,
                # Additional quantitative data for resource planning
                'avg_occupancy': round(avg_occupancy, 1),
                'max_occupancy': int(max_occupancy),
                'occupancy_volatility': round(occupancy_volatility, 1),
                'avg_daily_influx': round(avg_daily_influx, 1),
                'max_daily_influx': int(max_daily_influx),
                'seasonal_peak_factor': round(seasonal_peak_factor, 2),
                'capacity_utilization_rate': round((pred / capacity) * 100, 1),
                'excess_percentage': round((excess / capacity) * 100, 1)
            }
            recommendations.append(recommendation)
    
    return recommendations

def generate_llm_enhanced_recommendation(shelter_name, program_name, date, excess, capacity, historical_stats, weather_context=None):
    """
    Generate LLM-enhanced recommendations using OpenAI or similar.
    This is a template function that could be integrated with actual LLM APIs.
    """
    
    # Template for LLM prompt
    prompt = f"""
    As a shelter management expert, analyze this occupancy prediction:
    
    Shelter: {shelter_name}
    Program: {program_name}
    Date: {date.strftime('%Y-%m-%d')}
    Predicted excess: {excess} beds over capacity of {capacity}
    
    Historical context:
    - Average occupancy: {historical_stats.get('avg_occupancy', 0):.1f}
    - Max occupancy: {historical_stats.get('max_occupancy', 0):.1f}
    - Occupancy volatility: {historical_stats.get('volatility', 0):.1f}
    
    Weather context: {weather_context or 'No weather data available'}
    
    Provide:
    1. Risk assessment (LOW/MEDIUM/HIGH)
    2. Root cause analysis
    3. Specific actionable recommendations
    4. Resource requirements
    5. Timeline for implementation
    """
    
    # This would be replaced with actual LLM API call
    # For now, return a structured response
    return {
        'risk_assessment': 'HIGH' if excess > 5 else 'MEDIUM' if excess > 2 else 'LOW',
        'root_cause': f"Predicted occupancy of {capacity + excess} exceeds capacity by {excess} beds",
        'recommendations': [
            "Activate emergency overflow protocols",
            "Contact partner shelters for bed availability",
            "Increase staff coverage",
            "Prepare temporary accommodations"
        ],
        'resources_needed': [
            f"{excess} additional beds",
            "Additional staff for {excess} more clients",
            "Emergency funding for temporary accommodations"
        ],
        'timeline': "Immediate action required within 24-48 hours"
    }

def analyze_recommendation_patterns(all_recommendations):
    """Analyze patterns across all recommendations for strategic insights."""
    
    if not all_recommendations:
        return {}
    
    # Group by severity
    severity_counts = {}
    shelter_patterns = {}
    seasonal_patterns = {}
    
    for rec in all_recommendations:
        severity = rec.get('severity', 'UNKNOWN')
        shelter = rec['shelter_name']
        month = rec['date'].month
        
        # Count by severity
        severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Count by shelter
        if shelter not in shelter_patterns:
            shelter_patterns[shelter] = {'total': 0, 'high_severity': 0}
        shelter_patterns[shelter]['total'] += 1
        if severity == 'HIGH':
            shelter_patterns[shelter]['high_severity'] += 1
        
        # Count by season
        season = 'Winter' if month in [12, 1, 2] else 'Spring' if month in [3, 4, 5] else 'Summer' if month in [6, 7, 8] else 'Fall'
        seasonal_patterns[season] = seasonal_patterns.get(season, 0) + 1
    
    return {
        'severity_distribution': severity_counts,
        'shelter_patterns': shelter_patterns,
        'seasonal_patterns': seasonal_patterns,
        'total_recommendations': len(all_recommendations)
    }

def main():
    """Main modeling pipeline."""
    print("=== Shelter Occupancy Prediction Model ===\n")
    
    # Load and prepare data
    df = load_data()
    df = create_date_features(df)
    
    # Split data
    train_df, test_df = split_train_test(df)
    
    # Prepare features
    feature_columns = prepare_features(df)
    print(f"Using features: {feature_columns}\n")
    
    # Get unique shelter/program combinations
    shelter_programs = df[['SHELTER_NAME', 'PROGRAM_NAME']].drop_duplicates()
    print(f"Training models for {len(shelter_programs)} shelter/program combinations...\n")
    
    # Store results
    all_results = []
    all_recommendations = []
    
    # Train models for each shelter/program combination
    for idx, (_, row) in enumerate(shelter_programs.iterrows()):
        shelter_name = row['SHELTER_NAME']
        program_name = row['PROGRAM_NAME']
        
        print(f"Training model {idx+1}/{len(shelter_programs)}: {shelter_name} - {program_name}")
        
        model, predictions, rmse, mae = train_model_for_shelter(
            train_df, test_df, shelter_name, program_name, feature_columns
        )
        
        if model is not None:
            # Generate recommendations
            recommendations = generate_enhanced_recommendations(
                test_df, predictions, shelter_name, program_name, df
            )
            
            # Store results
            result = {
                'shelter_name': shelter_name,
                'program_name': program_name,
                'rmse': rmse,
                'mae': mae,
                'test_samples': len(predictions) if predictions is not None else 0,
                'recommendations_count': len(recommendations)
            }
            all_results.append(result)
            all_recommendations.extend(recommendations)
            
            print(f"  RMSE: {rmse:.2f}, MAE: {mae:.2f}, Recommendations: {len(recommendations)}")
        else:
            print(f"  Skipped - insufficient data")
    
    # Print summary results
    print("\n=== MODEL EVALUATION SUMMARY ===")
    if all_results:
        results_df = pd.DataFrame(all_results)
        print(f"\nAverage RMSE: {results_df['rmse'].mean():.2f}")
        print(f"Average MAE: {results_df['mae'].mean():.2f}")
        print(f"Total recommendations generated: {len(all_recommendations)}")
        
        # Show top 5 recommendations
        if all_recommendations:
            print("\n=== SAMPLE RECOMMENDATIONS ===")
            for i, rec in enumerate(all_recommendations[:5]):
                print(f"{i+1}. {rec['message']}")
            
            # Analyze patterns
            pattern_analysis = analyze_recommendation_patterns(all_recommendations)
            
            print("\n=== RECOMMENDATION PATTERN ANALYSIS ===")
            print(f"Total recommendations: {pattern_analysis['total_recommendations']}")
            
            if 'severity_distribution' in pattern_analysis:
                print("\nSeverity Distribution:")
                for severity, count in pattern_analysis['severity_distribution'].items():
                    print(f"  {severity}: {count} recommendations")
            
            if 'seasonal_patterns' in pattern_analysis:
                print("\nSeasonal Patterns:")
                for season, count in pattern_analysis['seasonal_patterns'].items():
                    print(f"  {season}: {count} recommendations")
            
            # Show shelters with most high-severity recommendations
            if 'shelter_patterns' in pattern_analysis:
                high_risk_shelters = [(shelter, data) for shelter, data in pattern_analysis['shelter_patterns'].items() 
                                    if data['high_severity'] > 0]
                if high_risk_shelters:
                    print("\nHigh-Risk Shelters (HIGH severity recommendations):")
                    for shelter, data in sorted(high_risk_shelters, key=lambda x: x[1]['high_severity'], reverse=True)[:5]:
                        print(f"  {shelter}: {data['high_severity']} high-severity recommendations")
        
        # Show best and worst performing models
        print("\n=== TOP PERFORMING MODELS (by RMSE) ===")
        top_models = results_df.nsmallest(5, 'rmse')[['shelter_name', 'program_name', 'rmse', 'mae']]
        for _, row in top_models.iterrows():
            print(f"{row['shelter_name']} - {row['program_name']}: RMSE={row['rmse']:.2f}, MAE={row['mae']:.2f}")
        
        print("\n=== MODELS WITH MOST RECOMMENDATIONS ===")
        top_recs = results_df.nlargest(5, 'recommendations_count')[['shelter_name', 'program_name', 'recommendations_count']]
        for _, row in top_recs.iterrows():
            print(f"{row['shelter_name']} - {row['program_name']}: {row['recommendations_count']} recommendations")
    
    else:
        print("No models were successfully trained.")

    # Save all recommendations to a JSON file
    recommendations_file = "recommendations.json"
    
    # Convert timestamps to strings for JSON serialization
    serializable_recommendations = []
    for rec in all_recommendations:
        serializable_rec = rec.copy()
        if 'date' in serializable_rec:
            serializable_rec['date'] = serializable_rec['date'].strftime('%Y-%m-%d')
        serializable_recommendations.append(serializable_rec)
    
    with open(recommendations_file, 'w') as f:
        json.dump(serializable_recommendations, f, indent=2)
    print(f"\nAll recommendations saved to {recommendations_file}")

if __name__ == "__main__":
    main() 
