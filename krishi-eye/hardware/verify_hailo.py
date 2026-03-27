#!/usr/bin/env python3
"""
verify_hailo.py — Multi-model NPU diagnostic for KRISHI-EYE.
Tests YOLO, Classifier, UNet, and SCDepth concurrent loading.

Usage:
    python3 verify_hailo.py --yolo yolov8n_seg.hef --cls potato_classifier.hef --unet lesion_segmentation.hef --depth scdepthv3.hef
"""

import numpy as np
import argparse
import time
import sys
import os
from hailo_live_pipeline_teensy import HailoInference
from hailo_platform import VDevice

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--yolo", default="yolov8n_seg.hef")
    ap.add_argument("--cls", default="potato_classifier.hef")
    ap.add_argument("--unet", default="lesion_segmentation.hef")
    ap.add_argument("--depth", default="scdepthv3.hef")
    args = ap.parse_args()

    # 1. Check HEF existence
    hefs = [args.yolo, args.cls, args.unet, args.depth]
    for h in hefs:
        if not os.path.exists(h):
            print(f"⚠️ Warning: Model {h} not found. Some tests will be skipped.")

    print("🚀 Initializing Hailo VDevice...")
    try:
        with VDevice() as vdevice:
            models = {}
            for name, path in [("YOLO", args.yolo), ("CLS", args.cls), 
                               ("UNet", args.unet), ("Depth", args.depth)]:
                if os.path.exists(path):
                    print(f"📦 Loading {name}: {path}...")
                    models[name] = HailoInference(path, vdevice)
            
            print(f"\n✅ All {len(models)} models loaded into NPU memory.")
            
            # 2. Run dummy inference for each
            for name, m in models.items():
                shape = m.input_shape
                if len(shape) == 4:
                    # (B, H, W, C) or (B, C, H, W)
                    h, w, c = (shape[1], shape[2], shape[3]) if shape[3] == 3 else (shape[2], shape[3], shape[1])
                elif len(shape) == 3:
                    # (H, W, C) or (C, H, W)
                    h, w, c = (shape[0], shape[1], shape[2]) if shape[2] == 3 else (shape[1], shape[2], shape[0])
                else:
                    h, w, c = 320, 320, 3 # Fallback
                
                print(f"⚡ Testing Inference: {name} (Input: {h}x{w}x{c})...")
                test_input = np.random.randint(0, 255, (h, w, c), dtype=np.uint8)
                
                t0 = time.perf_counter()
                out = m.run(test_input)
                ms = (time.perf_counter() - t0) * 1000.0
                print(f"   ✓ Success | Latency: {ms:.1f}ms | Outputs: {list(out.keys())}")
            
            print("\n🎉 NPU DIAGNOSTIC PASSED.")
    except Exception as e:
        sys.exit(f"❌ NPU Error: {e}")

if __name__ == "__main__":
    main()
