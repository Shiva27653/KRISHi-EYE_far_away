#!/usr/bin/env python3
"""
verify_motion.py — Motion fusion diagnostic for KRISHI-EYE.
Tests Stereo VO + IMU fusion at 1080p/720p.

Usage:
    python3 verify_motion.py --calib calib/stereo_calib_full.npz
"""

import cv2
import time
import argparse
import sys
import os
import threading
from motion_fusion import MotionFusion
from depth_fusion import DepthFusion

# ── CAMERA RING BUFFER (Copied from pipeline) ───
import subprocess
from collections import deque
import numpy as np

class _CamBuffer:
    def __init__(self, idx, w, h):
        self.idx, self.w, self.h = idx, w, h
        self._buf = deque(maxlen=4)
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._frame_size = int(w * h * 1.5)
        self._proc = None

    def start(self):
        cmd = ["rpicam-vid", "--camera", str(self.idx), "--width", str(self.w), 
               "--height", str(self.h), "--codec", "yuv420", "--nopreview", 
               "-t", "0", "--inline", "--flush", "-o", "-"]
        try:
            self._proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=self.w*self.h*2)
            threading.Thread(target=self._loop, daemon=True).start()
            return True
        except: return False

    def _loop(self):
        while not self._stop.is_set():
            raw = self._proc.stdout.read(self._frame_size)
            if len(raw) < self._frame_size: continue
            ts = time.perf_counter()
            yuv = np.frombuffer(raw, dtype=np.uint8).reshape(int(self.h*1.5), self.w)
            frame = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR_I420)
            with self._lock: self._buf.append((ts, frame))

    def latest(self):
        with self._lock: return self._buf[-1] if self._buf else None

    def closest_to(self, ts):
        with self._lock: return min(self._buf, key=lambda x: abs(x[0]-ts)) if self._buf else None

    def stop(self):
        self._stop.set()
        if self._proc: self._proc.terminate()

class StereoCapture:
    def __init__(self, w=1920, h=1080):
        self._left = _CamBuffer(0, w, h); self._right = _CamBuffer(1, w, h)
    def start(self):
        if not (self._left.start() and self._right.start()): return False
        time.sleep(1.0); return True
    def read(self):
        el = self._left.latest()
        if not el: return False, None, None, 0.0
        tl, fl = el
        er = self._right.closest_to(tl)
        if not er: return False, None, None, 0.0
        drift = abs(tl - er[0]) * 1000.0
        return True, fl, er[1], drift
    def release(self): self._left.stop(); self._right.stop()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--calib", default="calib/stereo_calib_full.npz")
    args = ap.parse_args()

    print("🛰️ Initializing MotionFusion & Capture...")
    motion = MotionFusion(args.calib)
    motion.start(warmup=True)  # Blocks ~5s for AHRS
    cap = StereoCapture(w=1920, h=1080)
    if not cap.start():
        sys.exit("❌ Failed to start cameras.")

    print("\n🚀 Ready. Move the cameras to rotate/translate.")
    print("   Press Q to finish.")

    try:
        count = 0
        while True:
            ret, fl, fr, drift = cap.read()
            if not ret: continue
            
            # Match 720p VO optimization from pipeline
            vl = cv2.resize(fl, (1280, 720), interpolation=cv2.INTER_AREA)
            vr = cv2.resize(fr, (1280, 720), interpolation=cv2.INTER_AREA)
            gl, gr = cv2.cvtColor(vl, cv2.COLOR_BGR2GRAY), cv2.cvtColor(vr, cv2.COLOR_BGR2GRAY)
            
            # 1. Update Motion
            motion.feed_stereo(gl, gr)
            
            # 2. Get State
            snap = motion.snapshot()
            
            # 3. Print
            if count % 10 == 0:
                print(f"[MOTION] dX={snap.vx_world_ms:.3f} dZ={snap.v_forward_ms:.3f} | "
                      f"Sync={drift:.1f}ms | Inliers={snap.vo_inliers}")
            
            img = np.hstack([cv2.resize(vl, (640, 360)), cv2.resize(vr, (640, 360))])
            cv2.putText(img, f"dX={snap.vx_world_ms:.2f} dZ={snap.v_forward_ms:.2f}", (20, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.imshow("Motion Audit", img)
            if cv2.waitKey(1) & 0xFF == ord('q'): break
            count += 1

    finally:
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
