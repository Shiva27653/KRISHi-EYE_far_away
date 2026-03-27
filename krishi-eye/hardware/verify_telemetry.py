#!/usr/bin/env python3
"""
verify_telemetry.py — Telemetry pipeline diagnostic for KRISHI-EYE.
Checks SQLite buffering and HTTP upload.

Usage:
    python3 verify_telemetry.py
"""

import time
import os
import sys
from telemetry_bridge import TelemetryBridge

# ── MOCKED CONFIG ──
class MockArgs:
    def __init__(self):
        self.no_telemetry = False
        self.tractor_id = "test-pi5"
        self.job_id = "test-job-001"

def main():
    db_path = "telemetry_test.db"
    os.environ["TELEMETRY_DB"] = db_path
    
    print(f"📊 Initializing TelemetryBridge (DB: {db_path})...")
    # Note: TelemetryBridge takes (tractor_id, job_id)
    bridge = TelemetryBridge(tractor_id="test-pi5", job_id="test-job-001")
    bridge.start()
    
    print("🛰️ Pushing test point to queue...")
    test_point = {
        "latitude": 18.5204,
        "longitude": 73.8167,
        "speedKmph": 5.0,
        "headingDeg": 180.0,
        "sprayActive": True,
        "infectionIntensity": 0.85,
        "recordedAt": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }
    
    # We must provide a mock GNSS provider so it doesn't skip the point
    bridge.set_gnss_provider(lambda: {"lat": 18.52, "lon": 73.81, "fix_ok": True})
    
    bridge.push_point(test_point)
    time.sleep(0.2) # Wait for background thread to drain mem_q into sqlite
    
    status = bridge.status_line()
    print(f"   Status: {status}")
    
    if "pts=1" in status:
        print("\n✅ SQLite Buffering: SUCCESS")
    else:
        print("\n❌ SQLite Buffering: FAILED (Check if GNSS was provided)")

    print("\n⏳ Waiting for HTTP Flush (Background)...")
    print("   Check your Webapp Dashboard for new points from 'test-pi5'.")
    
    # Let it run for a bit to allow HTTP sync
    time.sleep(5.0)
    bridge.stop()
    print("\n🏁 Test complete. Bridge stopped.")
    if os.path.exists(db_path):
        os.remove(db_path) # Cleanup test DB


if __name__ == "__main__":
    main()
