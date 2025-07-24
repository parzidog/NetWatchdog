import shutil
import subprocess
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from backend.routes import router

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)

# Ensure speedtest-cli is installed
@app.on_event("startup")
def ensure_speedtest_cli():
    if shutil.which("speedtest-cli") is None:
        try:
            subprocess.check_call(
                ["pip", "install", "speedtest-cli"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print("✅ speedtest-cli installed successfully.")
        except subprocess.CalledProcessError as e:
            print("❌ Failed to install speedtest-cli:", e)
    else:
        print("✅ speedtest-cli already available.")

# === Serve React Frontend ===
frontend_build_dir = Path(__file__).resolve().parent.parent / "frontend" / "build"

# Mount full build directory at root
if frontend_build_dir.exists():
    print("Mounting frontend from:", frontend_build_dir)
    app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="frontend")
else:
    print("❌ React build directory not found:", frontend_build_dir)
