import pandas as pd
import os

def load_and_merge_data() -> pd.DataFrame:
    # Get the project root directory (parent of Preprocessing folder)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Construct paths relative to project root
    raw_data_dir = os.path.join(project_root, "RawData")
    filenames = [
        os.path.join(raw_data_dir, "Daily shelter occupancy 2017.csv"),
        os.path.join(raw_data_dir, "Daily shelter occupancy 2018.csv"),
        os.path.join(raw_data_dir, "Daily shelter occupancy 2019.csv"),
        os.path.join(raw_data_dir, "Daily shelter occupancy 2020.csv")
    ]

    dfs = []
    for file in filenames:
        print(f"Loading {file} ...")
        df = pd.read_csv(file)
        dfs.append(df)

    full_df = pd.concat(dfs, ignore_index=True)
    print(f"Successfully merged {len(full_df)} rows from {len(filenames)} files")

    # Robust parsing for mixed date formats in OCCUPANCY_DATE
    print("Parsing OCCUPANCY_DATE column...")
    full_df['OCCUPANCY_DATE'] = pd.to_datetime(full_df['OCCUPANCY_DATE'], errors='coerce')

    mask = full_df['OCCUPANCY_DATE'].isna()

    full_df.loc[mask, 'OCCUPANCY_DATE'] = pd.to_datetime(
        full_df.loc[mask, 'OCCUPANCY_DATE'],
        format='%m/%d/%Y',
        errors='coerce'
    )

    if bool(full_df['OCCUPANCY_DATE'].isna().any()):
        print("Warning: dropping rows with unparseable dates")
        full_df = full_df.dropna(subset=['OCCUPANCY_DATE'])

    # Sort by occupancy date
    print("Sorting data by OCCUPANCY_DATE...")
    full_df = full_df.sort_values('OCCUPANCY_DATE').reset_index(drop=True)

    # Create new features
    print("Creating new features...")
    
    # OCCUPANCY_RATIO = OCCUPANCY / CAPACITY (handle division by zero safely)
    full_df['OCCUPANCY_RATIO'] = full_df['OCCUPANCY'] / full_df['CAPACITY'].replace(0, float('nan'))
    full_df['OCCUPANCY_RATIO'] = full_df['OCCUPANCY_RATIO'].fillna(0)  # Fill NaN with 0 for zero capacity
    
    # Group by SHELTER_NAME and PROGRAM_NAME to maintain per-shelter time series integrity
    print("Creating lag and rolling features by shelter and program...")
    full_df = full_df.sort_values(['SHELTER_NAME', 'PROGRAM_NAME', 'OCCUPANCY_DATE'])
    
    # Create lag features for OCCUPANCY: lag of 1 day and 7 days
    full_df['OCCUPANCY_LAG_1'] = full_df.groupby(['SHELTER_NAME', 'PROGRAM_NAME'])['OCCUPANCY'].shift(1)
    full_df['OCCUPANCY_LAG_7'] = full_df.groupby(['SHELTER_NAME', 'PROGRAM_NAME'])['OCCUPANCY'].shift(7)
    
    # Create 7-day rolling average of OCCUPANCY using transform to maintain index alignment
    full_df['OCCUPANCY_ROLLING_7'] = full_df.groupby(['SHELTER_NAME', 'PROGRAM_NAME'])['OCCUPANCY'].transform(
        lambda x: x.rolling(window=7, min_periods=1).mean()
    )
    
    # Fill NaN values in lag features with 0
    full_df['OCCUPANCY_LAG_1'] = full_df['OCCUPANCY_LAG_1'].fillna(0)
    full_df['OCCUPANCY_LAG_7'] = full_df['OCCUPANCY_LAG_7'].fillna(0)
    
    print(f"Feature creation complete. Final dataset has {len(full_df)} rows and {len(full_df.columns)} columns")

    # Final chronological sort for the output file
    print("Performing final chronological sort...")
    full_df = full_df.sort_values(['OCCUPANCY_DATE', 'SHELTER_NAME', 'PROGRAM_NAME']).reset_index(drop=True)

    # Create output directory if it doesn't exist
    output_dir = os.path.join(project_root, "data")
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to a master CSV
    output_path = os.path.join(output_dir, "shelter_master.csv")
    print(f"Saving processed data to {output_path}...")
    full_df.to_csv(output_path, index=False)
    print(f"Successfully saved merged CSV to {output_path}")

    return full_df

if __name__ == "__main__":
    merged_df = load_and_merge_data()
