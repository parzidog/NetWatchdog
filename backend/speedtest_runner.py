import subprocess
import json
from datetime import datetime
from pathlib import Path

LOG_FILE = Path("speedtest_log.json")

def log_result(data):
    try:
        # Load existing log or start a new list
        if LOG_FILE.exists():
            with open(LOG_FILE, "r") as f:
                history = json.load(f)
        else:
            history = []

        # Append new result
        history.append(data)

        # Write updated history
        with open(LOG_FILE, "w") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"Error logging speedtest result: {e}")

def run_speed_test():
    try:
        result = subprocess.run(
            ["speedtest-cli", "--json"],
            capture_output=True,
            text=True,
            timeout=60
        )

        data = json.loads(result.stdout)
        download = round(data["download"] / 1_000_000, 2)
        upload = round(data["upload"] / 1_000_000, 2)
        ping = data["ping"]

        timestamp = datetime.now().isoformat()
        entry = {
            "timestamp": timestamp,
            "download_mbps": download,
            "upload_mbps": upload,
            "ping_ms": ping,
        }

        # Flag if below threshold
        if download < 300:
            entry["below_threshold"] = True

        log_result(entry)

        return entry
    except Exception as e:
        return {"error": str(e)}
