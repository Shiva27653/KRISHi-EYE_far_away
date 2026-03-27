#!/usr/bin/env python3
"""
verify_uart.py — Physical UART diagnostic for KRISHI-EYE <-> Teensy 4.1.
Tests the 14-field TX and 16-field RX (ACK) protocol.

Usage:
    python3 verify_uart.py --port /dev/ttyACM0
"""

import serial
import time
import argparse
import sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", default="/dev/ttyACM0")
    ap.add_argument("--baud", type=int, default=115200)
    args = ap.parse_args()

    print(f"🔌 Opening {args.port} at {args.baud} baud...")
    try:
        ser = serial.Serial(args.port, args.baud, timeout=1.0)
    except Exception as e:
        sys.exit(f"❌ Failed to open port: {e}")

    # 1. Clear buffers
    ser.reset_input_buffer()
    ser.reset_output_buffer()

    print("🚀 Sending 14-field test packet...")
    # Fields: h_cam, v_cam, h_noz, v_noz, steps, v1, v2, v3, v4, buzz, t1, t2, t3, t4
    test_packet = "90 45 90 45 100 1 0 1 0 0 500 400 300 200\n"
    ser.write(test_packet.encode())
    print(f"   Sent: {test_packet.strip()}")

    print("⏳ Waiting for 16-field ACK...")
    t0 = time.time()
    ack_received = False
    
    while time.time() - t0 < 3.0:
        if ser.in_waiting > 0:
            line = ser.readline().decode().strip()
            print(f"   Raw RX: {line}")
            if line.startswith("ACK:"):
                fields = line.replace("ACK:", "").strip().split()
                if len(fields) >= 14:
                    print(f"\n✅ SUCCESS! Received {len(fields)} fields.")
                    print(f"   [SYNC] Field 0: {fields[0]} (Echo)")
                    print(f"   [TANK] B={fields[4]}, F={fields[5]}, N={fields[6]}, P={fields[7]}")
                    ack_received = True
                    break
                else:
                    print(f"   ⚠️ Incomplete ACK: Expected 14+ fields, got {len(fields)}")

    if not ack_received:
        print("\n❌ TIMEOUT: No valid ACK received from Teensy.")
        print("   Check: Wiring (TX/RX), Teensy Power, and Firmware Version.")

    ser.close()

if __name__ == "__main__":
    main()
