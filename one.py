import numpy as np
import matplotlib.pyplot as plt
import os

# Configuration dictionary for different IMD datasets
# This tells the script how to reshape the arrays based on the data type
IMD_CONFIG = {
    'TMIN': {'missing_value': 99.9, 'lat_grids': 31, 'lon_grids': 31},
    'TMAX': {'missing_value': 99.9, 'lat_grids': 31, 'lon_grids': 31},
    'RAIN': {'missing_value': -999.0, 'lat_grids': 129, 'lon_grids': 135}
}

def ingest_imd_grd(file_path, data_type):
    """
    Reads an IMD Gridded Binary (.GRD) file for Rainfall, Min Temp, or Max Temp.
    data_type must be one of: 'TMIN', 'TMAX', 'RAIN'
    """
    if data_type not in IMD_CONFIG:
        print(f"Error: data_type must be one of {list(IMD_CONFIG.keys())}")
        return None

    print(f"\n--- Initiating Data Ingestion for: {data_type} ---")
    print(f"Reading file: {file_path}")
    
    config = IMD_CONFIG[data_type]
    
    try:
        # 1. Load the raw binary data as 32-bit floats
        raw_data = np.fromfile(file_path, dtype=np.float32)
        print(f"Success: Loaded {raw_data.shape[0]} total data points.")
        
        # 2. Handling Missing Values
        # Replace the specific missing value indicator with NaN (Not a Number)
        missing_val = config['missing_value']
        raw_data[raw_data == missing_val] = np.nan 
        
        # 3. Dynamic Reshaping
        pixels_per_day = config['lat_grids'] * config['lon_grids']
        
        if raw_data.shape[0] % pixels_per_day == 0:
            days = int(raw_data.shape[0] / pixels_per_day)
            
            # Reshape into 3D Array: (Time, Latitude, Longitude)
            reshaped_data = raw_data.reshape((days, config['lat_grids'], config['lon_grids']))
            
            print(f"Data successfully reshaped to: {reshaped_data.shape} (Days, Lat, Lon)")
            return reshaped_data
        else:
            print(f"Warning: File size does not match expected grid for {data_type}.")
            return raw_data

    except Exception as e:
        print(f"Ingestion Failed: {e}")
        return None

def visualize_day(data_3d, data_type, day_index=0):
    """
    Visualizes a single day's grid using matplotlib.
    Automatically picks colors based on whether it is rain or temperature.
    """
    if data_3d is None or len(data_3d.shape) != 3:
        print("Invalid data for visualization.")
        return

    print(f"Generating visualization for {data_type} on Day {day_index + 1}...")
    
    plt.figure(figsize=(10, 8))
    
    # Pick a color map: 'coolwarm' for temp, 'Blues' for rainfall
    cmap = 'Blues' if data_type == 'RAIN' else 'coolwarm'
    label = 'Rainfall (mm)' if data_type == 'RAIN' else 'Temperature (°C)'
    
    # Plotting the 2D matrix
    plt.imshow(data_3d[day_index], cmap=cmap, origin='lower')
    
    plt.colorbar(label=label)
    plt.title(f'IMD {data_type} Grid - Day {day_index + 1}')
    plt.xlabel('Longitude Grid Index')
    plt.ylabel('Latitude Grid Index')
    
    plt.tight_layout()
    plt.show()

def ingest_historical_data(base_dir, data_type, start_year=1974, end_year=2025):
    """
    Loops through years, reads each .GRD file, and stitches them into one massive timeline.
    Assumes files are named like 'Mintemp_MinT_YYYY.GRD' or 'Rainfall_YYYY.GRD'
    """
    if data_type not in IMD_CONFIG:
        print(f"Error: Unknown data type {data_type}")
        return None

    print(f"\n=== Building Climate History for {data_type} ({start_year}-{end_year}) ===")
    
    all_years_data = []
    
    for year in range(start_year, end_year + 1):
        # Construct expected filename based on the data type
        if data_type == 'TMIN':
            filename = f"Mintemp_MinT_{year}.GRD"
        elif data_type == 'TMAX':
            filename = f"Maxtemp_MaxT_{year}.GRD"
        elif data_type == 'RAIN':
            filename = f"Rainfall_{year}.GRD"
            
        file_path = os.path.join(base_dir, filename)
        
        if os.path.exists(file_path):
            # Read the individual year's data
            year_data = ingest_imd_grd(file_path, data_type)
            if year_data is not None:
                all_years_data.append(year_data)
                print(f"[{year}] Loaded successfully.")
        else:
            print(f"[{year}] Warning: File not found at {file_path}")

    if not all_years_data:
        print("No historical data found to concatenate!")
        return None

    # Stitch all the years together along the time axis (axis 0)
    print("\nStitching decades of data together... Please wait...")
    massive_timeline = np.concatenate(all_years_data, axis=0)
    
    print(f"\nSUCCESS: Created massive {data_type} timeline!")
    print(f"Final Shape: {massive_timeline.shape} (Total Days, Lat, Lon)")
    
    return massive_timeline

# --- Example Usage ---
if __name__ == "__main__":
    # Update these paths to where you saved your 3 downloaded files!
    path_min_temp = r'C:\Users\deves\Downloads\Mintemp_MinT_2025.GRD'
    path_max_temp = r'C:\Users\deves\Downloads\Maxtemp_MaxT_2025.GRD' # Example
    path_rain     = r'C:\Users\deves\Downloads\Rainfall_2025.GRD'     # Example

    # Test 1: Minimum Temperature
    if os.path.exists(path_min_temp):
        tmin_data = ingest_imd_grd(path_min_temp, 'TMIN')
        visualize_day(tmin_data, 'TMIN', day_index=0)
        
    # --- How to use the new Historical Ingestion (Save this for after exams!) ---
    # folder_path = r'C:\Users\deves\Downloads\IMD_Data'
    # full_history_tmin = ingest_historical_data(folder_path, 'TMIN', 1974, 2025)
    
    # Test 2: Rainfall (You can uncomment this when you have the rain file path ready)
    # if os.path.exists(path_rain):
    #     rain_data = ingest_imd_grd(path_rain, 'RAIN')
    #     visualize_day(rain_data, 'RAIN', day_index=0)