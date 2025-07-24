from fastapi import APIRouter
from backend.scanner import scan_network
from backend.speedtest_runner import run_speed_test
from backend.network_utils import get_default_gateway_info
import json
import os

router = APIRouter()
HISTORY_FILE = "backend/speedtest_history.json"

@router.get("/speedtest/history")
def get_speedtest_history():
    history_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "speedtest_log.json")
    try:
        with open(history_path, "r") as f:
            return json.load(f)
    except Exception as e:
        return {"error": str(e)}


@router.get("/scan")
def scan():
    return scan_network()

@router.get("/speedtest")
def speedtest():
    return run_speed_test()

@router.get("/gateway")
def gateway():
    return get_default_gateway_info()
