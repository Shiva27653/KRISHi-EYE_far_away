#!/usr/bin/env python3
"""
depth_fusion.py — Reusable sparse SGBM depth module for KRISHI-EYE

Extracted from depth_test.py.  Preserves the 3-stage SGBM cascade
(fast bs=3 / mid bs=5 / slow bs=7), confidence scoring, EMA temporal
smoothing, and bounded non-blocking worker thread.

API:
    fuser = DepthFusion(calib_path)
    fuser.submit(target_id, cx, cy, rect_l, rect_r, drift_ms=X)
    results = fuser.poll_results()                     # list of dicts
    latest  = fuser.get_latest_for_target(target_id)   # dict or None
    fuser.stop()

Each result dict:
    target_id, cx, cy, depth_m, disparity, confidence,
    method, latency_ms, valid

A4. drift_ms is passed to weight the confidence: drift > 10ms reduces confidence.
"""

import cv2
import numpy as np
import os
import sys
import time
import threading
import queue as queue_mod
from collections import deque
from typing import Optional, Dict, List

# ── A1. SGBM parameters (tuned for 1080p always-on mode) ──────────
NUM_DISPARITIES = 256
BLOCK_SIZE_FAST  = 3
BLOCK_SIZE_MID   = 5
BLOCK_SIZE_SLOW  = 7
STRIP_HALF_H     = 160       # was 120
ROI_RIGHT_CTX = 160
MIN_VALID_DISP   = 1.0
MAX_DEPTH_M      = 5.0
MIN_VALID_RATIO = 0.04
MIN_VALID_SLOW = 0.02
EMA_ALPHA        = 0.35      # was 0.4
EMA_HISTORY      = 8         # was 6
MIN_EDGE_ND = 96
MEDIAN_WIN_CLOSE = 6
MEDIAN_WIN_MID   = 10
MEDIAN_WIN_FAR   = 16
CLAHE_CLIP       = 3.5
CLAHE_GRID       = (8, 4)

# A3: Stale target eviction timeout (seconds).
EVICT_STALE_S    = 2.0

P1_FAST  = 8  * 3 * BLOCK_SIZE_FAST ** 2
P2_FAST  = 32 * 3 * BLOCK_SIZE_FAST ** 2
P1_MID   = 8  * 3 * BLOCK_SIZE_MID  ** 2
P2_MID   = 32 * 3 * BLOCK_SIZE_MID  ** 2
P1_SLOW  = 8  * 3 * BLOCK_SIZE_SLOW ** 2
P2_SLOW  = 32 * 3 * BLOCK_SIZE_SLOW ** 2

_CLAHE = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=CLAHE_GRID)

# ── matcher factories ─────────────────────────────────────────────

def _make_sgbm(block_size, p1, p2, num_disp=None, unique_ratio=3):
    nd = num_disp if num_disp is not None else NUM_DISPARITIES
    nd = max(16, (nd // 16) * 16)
    return cv2.StereoSGBM_create(
        minDisparity=0, numDisparities=nd, blockSize=block_size,
        P1=p1, P2=p2, disp12MaxDiff=1, uniquenessRatio=unique_ratio,
        speckleWindowSize=200, speckleRange=2, preFilterCap=31,
        mode=cv2.STEREO_SGBM_MODE_SGBM)


_edge_cache: dict = {}

def _get_edge_matchers(effective_nd: int):
    if effective_nd not in _edge_cache:
        _edge_cache[effective_nd] = (
            _make_sgbm(BLOCK_SIZE_FAST, P1_FAST, P2_FAST, num_disp=effective_nd, unique_ratio=3),
            _make_sgbm(BLOCK_SIZE_MID,  P1_MID,  P2_MID,  num_disp=effective_nd, unique_ratio=2),
            _make_sgbm(BLOCK_SIZE_SLOW, P1_SLOW, P2_SLOW, num_disp=effective_nd, unique_ratio=3),
        )
    return _edge_cache[effective_nd]


# ── A6. INTERNAL HELPERS ──────────────────────────────────────────

def _preprocess(gray, skip_clahe: bool = False):
    """Gaussian blur + optional CLAHE (pipeline usually handles CLAHE)."""
    if not skip_clahe:
        gray = _CLAHE.apply(gray)
    return cv2.GaussianBlur(gray, (3, 3), 0)


def _compute_disparity(matcher, rect_l, rect_r, x1, x2, y1, y2):
    crop_l = _preprocess(cv2.cvtColor(rect_l[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY), skip_clahe=True)
    crop_r = _preprocess(cv2.cvtColor(rect_r[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY), skip_clahe=True)
    t0 = time.perf_counter()
    raw = matcher.compute(crop_l, crop_r).astype(np.float32) / 16.0
    ms = (time.perf_counter() - t0) * 1000.0
    return raw, ms


def _sample_disparity(raw, cx, cy, x1, y1, mw):
    px, py = cx - x1, cy - y1
    region = raw[max(0, py - mw):min(raw.shape[0], py + mw),
                 max(0, px - mw):min(raw.shape[1], px + mw)]
    total = region.size
    valid = region[region > MIN_VALID_DISP]
    conf = len(valid) / total if total > 0 else 0.0
    return valid, conf


def _adaptive_median_window(disp_val):
    if disp_val is None or disp_val > 200:
        return MEDIAN_WIN_CLOSE
    elif disp_val > 80:
        return MEDIAN_WIN_MID
    return MEDIAN_WIN_FAR


def _finalize(valid, conf, ms, focal_px, baseline_m, method):
    d = float(np.median(valid))
    depth = focal_px * baseline_m / d
    if depth <= 0 or depth > MAX_DEPTH_M:
        return None, d, ms, conf * 100, method
    return depth, d, ms, conf * 100, method


def _depth_at_point(fast_m, mid_m, slow_m, rect_l, rect_r,
                    focal_px, baseline_m, cx, cy):
    """3-stage SGBM cascade — identical logic to depth_test.py."""
    h, w = rect_l.shape[:2]
    y1 = max(0, cy - STRIP_HALF_H)
    y2 = min(h, cy + STRIP_HALF_H)
    if (y2 - y1) < BLOCK_SIZE_SLOW * 2:
        return None, None, 0.0, 0.0, "skip"

    # ── A3. FIX LEFT-EDGE LOGIC ───────────────────────────────────
    x1_tmp = max(0, cx - NUM_DISPARITIES - BLOCK_SIZE_FAST)
    x2_tmp = min(w, cx + ROI_RIGHT_CTX)
    left_edge = False
    if (x2_tmp - x1_tmp) < NUM_DISPARITIES:
        left_edge = True
        effectivend = max(MIN_EDGE_ND,
                          min(cx + ROI_RIGHT_CTX, NUM_DISPARITIES))
        effectivend = (effectivend // 16) * 16
        x1 = 0
        x2 = min(w, cx + ROI_RIGHT_CTX)
        fast_m, mid_m, slow_m = _get_edge_matchers(effectivend)
    else:
        x1, x2 = x1_tmp, x2_tmp

    suffix = "-edge" if left_edge else ""
    total_ms = 0.0

    # Stage 1: bs=3
    raw, ms = _compute_disparity(fast_m, rect_l, rect_r, x1, x2, y1, y2)
    total_ms += ms
    valid, conf = _sample_disparity(raw, cx, cy, x1, y1, MEDIAN_WIN_MID)
    if conf >= MIN_VALID_RATIO and valid.size > 0:
        mw = _adaptive_median_window(float(np.median(valid)))
        valid, conf = _sample_disparity(raw, cx, cy, x1, y1, mw)
        if conf >= MIN_VALID_RATIO:
            return _finalize(valid, conf, total_ms, focal_px, baseline_m,
                             f"fast{suffix}")

    # Stage 2: bs=5
    raw, ms = _compute_disparity(mid_m, rect_l, rect_r, x1, x2, y1, y2)
    total_ms += ms
    valid, conf = _sample_disparity(raw, cx, cy, x1, y1, MEDIAN_WIN_MID)
    if conf >= MIN_VALID_RATIO and valid.size > 0:
        mw = _adaptive_median_window(float(np.median(valid)))
        valid, conf = _sample_disparity(raw, cx, cy, x1, y1, mw)
        if conf >= MIN_VALID_RATIO:
            return _finalize(valid, conf, total_ms, focal_px, baseline_m,
                             f"mid{suffix}")

    # Stage 3: bs=7
    raw, ms = _compute_disparity(slow_m, rect_l, rect_r, x1, x2, y1, y2)
    total_ms += ms
    valid, conf = _sample_disparity(raw, cx, cy, x1, y1, MEDIAN_WIN_FAR)
    if conf >= MIN_VALID_SLOW and valid.size > 0:
        return _finalize(valid, conf, total_ms, focal_px, baseline_m,
                         f"slow{suffix}")

    return None, None, total_ms, conf * 100, f"fail{suffix}"


# ── EMA temporal filter ───────────────────────────────────────────

class _TemporalFilter:
    def __init__(self):
        self._history: dict = {}
        self._ema: dict = {}

    def update(self, key, depth_m: float) -> float:
        if key not in self._ema:
            self._history[key] = deque(maxlen=EMA_HISTORY)
            self._ema[key] = depth_m
        prev = self._ema[key]
        if self._history[key] and abs(depth_m - prev) / max(prev, 1e-6) > 0.35:
            return prev
        self._history[key].append(depth_m)
        self._ema[key] = EMA_ALPHA * depth_m + (1.0 - EMA_ALPHA) * prev
        return self._ema[key]

    def evict_stale(self, active_timestamps: dict, now: float,
                    stale_s: float = EVICT_STALE_S):
        """Evict targets not seen for > stale_s seconds."""
        for k in list(self._ema):
            last_seen = active_timestamps.get(k, 0.0)
            if (now - last_seen) > stale_s:
                self._history.pop(k, None)
                self._ema.pop(k, None)


# ── PUBLIC API ────────────────────────────────────────────────────

class DepthFusion:
    # A5. ADD CALIBRATION AUTO-SCALE
    def __init__(self, calib_path: str, target_w: int = 1280, target_h: int = 720):
        if not os.path.exists(calib_path):
            print(f"[depth_fusion] WARNING: calib file {calib_path} not found; "
                  "SGBM depth will be unavailable.")
            self._available = False
            return

        data = np.load(calib_path, allow_pickle=False)
        self._map1x = data["map1x"]
        self._map1y = data["map1y"]
        self._map2x = data["map2x"]
        self._map2y = data["map2y"]

        # ── A5. AUTO-SCALE CALIB MAPS ──────────────────────────────
        calib_h, calib_w = self._map1x.shape[:2]
        if (calib_h, calib_w) != (target_h, target_w):
            print(f"[depth_fusion] Scaling calib maps "
                  f"({calib_w}×{calib_h}) → ({target_w}×{target_h})")
            def _scale(m):
                return cv2.resize(m, (target_w, target_h),
                                  interpolation=cv2.INTER_LINEAR)
            
            # Recalculate scaling factors for focal length adjustment
            sx = target_w / calib_w
            sy = target_h / calib_h
            
            self._map1x = np.ascontiguousarray((_scale(self._map1x) * sx).astype(np.float32))
            self._map1y = np.ascontiguousarray((_scale(self._map1y) * sy).astype(np.float32))
            self._map2x = np.ascontiguousarray((_scale(self._map2x) * sx).astype(np.float32))
            self._map2y = np.ascontiguousarray((_scale(self._map2y) * sy).astype(np.float32))
            
            # A7: Debug and handle possible 2-channel maps (CV_32FC2)
            print(f"[depth_fusion] Maps scaled. map1x.shape={self._map1x.shape} dtype={self._map1x.dtype}")
            if self._map1x.ndim == 3 and self._map1x.shape[2] == 2:
                print("[depth_fusion] Detected 2-channel map (CV_32FC2). map2 must be empty.")
                self._map1y = None
            if self._map2x.ndim == 3 and self._map2x.shape[2] == 2:
                self._map2y = None

            Q = data["Q"].astype(np.float64).copy()
            Q[0, 3] *= sx
            Q[1, 3] *= sy
            Q[2, 3] *= sx
            self._focal_px  = float(Q[2, 3])
            self._baseline_m = abs(-1.0 / Q[3, 2]) if Q[3, 2] != 0 else 0.0
        else:
            Q = data["Q"].astype(np.float64)
            self._focal_px = float(Q[2, 3])
            self._baseline_m = abs(-1.0 / Q[3, 2]) if Q[3, 2] != 0 else 0.0

        self._fast = _make_sgbm(BLOCK_SIZE_FAST, P1_FAST, P2_FAST, unique_ratio=3)
        self._mid  = _make_sgbm(BLOCK_SIZE_MID,  P1_MID,  P2_MID,  unique_ratio=2)
        self._slow = _make_sgbm(BLOCK_SIZE_SLOW, P1_SLOW, P2_SLOW, unique_ratio=3)
        self._temporal = _TemporalFilter()
        self._latest: Dict[str, dict] = {}

        self._target_timestamps: Dict[str, float] = {}
        self._ts_lock = threading.Lock()

        # A2. req_q AND res_q sizes
        self._req_q = queue_mod.Queue(maxsize=12)  # was 4
        self._res_q = queue_mod.Queue(maxsize=64)  # was 32
        self._stop_evt = threading.Event()
        self._thread = threading.Thread(target=self._loop, daemon=True,
                                        name="sgbm-depth")
        self._thread.start()
        self._available = True
        print(f"[depth_fusion] SGBM ready | f={self._focal_px:.1f}px | maps={target_w}x{target_h}")

    @property
    def available(self) -> bool:
        return self._available

    def rectify(self, frame_l: np.ndarray, frame_r: np.ndarray):
        """Rectify a stereo pair using calibration maps."""
        # A7: map2 must be None if map1 is CV_32FC2
        m1y = self._map1y if (hasattr(self, '_map1y') and self._map1y is not None) else None
        m2y = self._map2y if (hasattr(self, '_map2y') and self._map2y is not None) else None
        
        rl = cv2.remap(frame_l, self._map1x, m1y, cv2.INTER_LINEAR)
        rr = cv2.remap(frame_r, self._map2x, m2y, cv2.INTER_LINEAR)
        return rl, rr

    # A4. UPDATE submit() signature
    def submit(self, target_id: str, cx: int, cy: int,
               rect_l: np.ndarray, rect_r: np.ndarray,
               drift_ms: float = 0.0) -> bool:
        """Submit a depth request. Returns False if queue full."""
        if not self._available:
            return False
        with self._ts_lock:
            self._target_timestamps[target_id] = time.time()
        try:
            # A4. put_nowait() call
            self._req_q.put_nowait((target_id, cx, cy,
                                    rect_l.copy(), rect_r.copy(), drift_ms))
            return True
        except queue_mod.Full:
            return False

    def poll_results(self) -> List[dict]:
        """Drain all completed results from the worker."""
        out = []
        while True:
            try:
                res = self._res_q.get_nowait()
                self._latest[res["target_id"]] = res
                out.append(res)
            except queue_mod.Empty:
                break
        return out

    def get_latest_for_target(self, target_id: str) -> Optional[dict]:
        return self._latest.get(target_id)

    def stop(self):
        self._stop_evt.set()

    # ── worker loop ───────────────────────────────────────────────
    def _loop(self):
        evict_counter = 0
        while not self._stop_evt.is_set():
            try:
                # A4. unpack drift_ms
                tid, cx, cy, rl, rr, drift_ms = self._req_q.get(timeout=0.05)
            except queue_mod.Empty:
                continue

            depth, disp, ms, conf, method = _depth_at_point(
                self._fast, self._mid, self._slow,
                rl, rr, self._focal_px, self._baseline_m, cx, cy)

            # A4. drift penalty
            if drift_ms > 10.0 and conf is not None:
                drift_penalty = max(0.3, 1.0 - (drift_ms - 10.0) / 100.0)
                conf = conf * drift_penalty
                method = f"{method}~{drift_ms:.0f}ms"

            smoothed = None
            if depth is not None:
                smoothed = self._temporal.update(tid, depth)

            result = {
                "target_id": tid,
                "cx": cx, "cy": cy,
                "depth_m": smoothed if smoothed is not None else depth,
                "depth_raw_m": depth,
                "disparity": disp,
                "confidence": conf,
                "method": method,
                "latency_ms": ms,
                "valid": depth is not None,
            }
            try:
                self._res_q.put_nowait(result)
            except queue_mod.Full:
                pass

            evict_counter += 1
            if evict_counter >= 10:
                evict_counter = 0
                with self._ts_lock:
                    ts_snapshot = dict(self._target_timestamps)
                self._temporal.evict_stale(ts_snapshot, time.time())
