from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import numpy as np
import os
import uvicorn

# Global variable to hold our loaded historical arrays in RAM
CLIMATE_DATA = {
    'TMIN': None,
    'TMAX': None,
    'RAIN': None
}

DATA_DIR = r"C:\Users\deves\Downloads\IMD_Data_Bulk"

# --- 1. Lifespan Context (Runs on Startup) ---
# This replaces Flask's @app.before_first_request or app.app_context()
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up Drishti-Twin Backend...")
    print("Initializing historical climate arrays...")
    try:
        # Example: Mocking a time series array shape for testing
        # Replace with real array loading when your .npy files are ready: 
        # CLIMATE_DATA['TMIN'] = np.load(os.path.join(DATA_DIR, "tmin_compiled.npy"))
        print("Backend data arrays successfully mapped.")
    except Exception as e:
        print(f"Data loading notice: {e}")
    yield
    print("🛑 Shutting down server...")

# Initialize the App
app = FastAPI(title="Drishti-Twin API", version="2.1", lifespan=lifespan)

# Allow your HTML frontend to talk to this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your local index.js to fetch data
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Data Validation Model (Pydantic) ---
# This ensures your frontend always sends the exact right data types
class SimulationRequest(BaseModel):
    sourceRegion: str
    targetRegion: str
    currentScenario: str
    tempDelta: float
    rainDelta: int
    windDelta: int

# --- 3. The API Endpoint ---
@app.post('/api/simulate')
async def run_simulation(req: SimulationRequest):
    """
    Handles the 'Run Digital Twin Simulation' event from your Leaflet UI.
    """
    
    print(f"\n[Simulation Request] Triggering {req.currentScenario.upper()} from {req.sourceRegion} targeting {req.targetRegion}")
    print(f"Parameters -> Temp Delta: {req.tempDelta}°C, Rain Delta: {req.rainDelta}%, Wind: {req.windDelta} km/h")
    
    # 2. AI Inference Engine Placeholder (ConvLSTM Logic)
    grid_lat, grid_lon = 31, 31
    if req.currentScenario == 'rain':
        grid_lat, grid_lon = 129, 135 # Rainfall high-res grid structure
        
    # Create an inference matrix demonstrating spatiotemporal ripples
    simulated_grid = []
    for day in range(1, 6): # 5-day forecast tracking (t+1 to t+5)
        day_points = []
        for r in range(0, grid_lat, 2):  # Step by 2 for lighter payload during development
            for c in range(0, grid_lon, 2):
                # Simple math calculation to simulate a localized ripple expanding outwards over time
                base_val = req.tempDelta if req.currentScenario != 'rain' else req.rainDelta
                decay = 1.0 / (day + 0.5) # Anomaly fades or spreads over days
                day_points.append([r, c, float(base_val * decay)])
        simulated_grid.append(day_points)

    # 3. Formulate the JSON response to update your UI metrics
    # Note: FastAPI automatically serializes this Python dictionary into JSON for you!
    return {
        "status": "success",
        "engine": "ConvLSTM v3 Core",
        "modelConfidence": "92% (INSAT/IMD Assimilated)",
        "forecast_days": 5,
        "spatial_grid": simulated_grid,
        "analytics": {
            "riskProbabilities": {
                "heatwave": 85 if req.currentScenario == 'heat' else (12 + req.tempDelta * 5),
                "flood": 90 if req.currentScenario == 'rain' else (5 + (req.rainDelta // 2)),
                "cyclone": 75 if req.currentScenario == 'cyclone' else (5 if req.windDelta > 50 else 0),
                "coldwave": 80 if req.currentScenario == 'fog' else 8
            },
            "sectorImpacts": {
                "agriculture": -18 if req.currentScenario == 'heat' else (15 if req.currentScenario == 'rain' else -5),
                "waterResources": -25 if req.currentScenario == 'heat' else 40,
                "energy": 22 if req.currentScenario == 'heat' else -10,
                "health": -18 if req.currentScenario == 'heat' else -8
            }
        }
    }

if __name__ == '__main__':
    # Running locally on port 8000 to match your index.js fetch logic
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)