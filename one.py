import numpy as np
import matplotlib.pyplot as plt

def ingest_imd_grd(file_path):
    """
    Reads an IMD Gridded Binary (.GRD) file.
    """
    print(f"Initiating Data Ingestion for: {file_path}...")
    
    try:
        # 1. Load the raw binary data as 32-bit floats
        raw_data = np.fromfile(file_path, dtype=np.float32)
        print(f"Success: Loaded {raw_data.shape[0]} data points.")
        
        # 2. Handling Missing Values
        # IMD usually uses 99.9 or -999.0 to represent missing/ocean data.
        # We replace these with NaN (Not a Number) so the AI ignores them.
        raw_data[raw_data == 99.9] = np.nan 
        
        # 3. Reshaping the Data (Crucial Step)
        # You will need to check the IMD metadata for exact grid dimensions.
        # Example: If the data is 1 degree resolution over India (Lat 8-38, Lon 68-98)
        # It usually shapes into (Time_Steps, Lats, Lons) -> e.g., (365, 31, 31)
        # reshaped_data = raw_data.reshape((365, 31, 31)) 
        
        return raw_data

    except Exception as e:
        print(f"Ingestion Failed: {e}")
        return None

# --- To test this post-exams ---
# filepath = 'Mintemp_MinT_2025.GRD'
# min_temp_array = ingest_imd_grd(filepath)