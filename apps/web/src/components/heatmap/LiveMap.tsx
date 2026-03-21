'use client'

import React, { useMemo, useState } from 'react';
import { TractorMarker } from '@/components/map/tractor-marker';
import { FarmHeatmap } from '@/components/map/farm-heatmap';
import { RouteTrail } from '@/components/map/route-trail';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Satellite, Droplets, AlertTriangle, Activity } from 'lucide-react';

interface LiveMapProps {
    jobId: string;
    tractorId: string;
    isLive: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({ jobId, tractorId, isLive }) => {
    const { latestPoint, history, startSimulation, stopSimulation } = useTelemetry(jobId);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    React.useEffect(() => {
        if (isLive) {
            startSimulation(tractorId);
        } else {
            stopSimulation();
        }
    }, [isLive, jobId, tractorId, startSimulation, stopSimulation]);

    const currentPoint = latestPoint?.point;

    // Convert history to point array for RouteTrail
    const trailPoints = useMemo(() => 
        history
            .filter(h => h.point.lat !== undefined && h.point.lng !== undefined)
            .map(h => ({ lat: h.point.lat!, lng: h.point.lng! })), 
    [history]);

    // Format history for FarmHeatmap
    const heatmapData = useMemo(() => 
        history
            .filter(h => h.point.lat !== undefined && h.point.lng !== undefined && h.point.heatWeight !== undefined && h.point.infectionIntensity !== undefined)
            .map(h => ({
                lat: h.point.lat!,
                lng: h.point.lng!,
                weight: h.point.heatWeight!,
                intensity: h.point.infectionIntensity!
            })),
    [history]);

    if (!currentPoint && isLive) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white font-medium">
                Connecting to live telemetry...
            </div>
        );
    }

    return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
            background: 'color-mix(in srgb, var(--surface) 30%, transparent)',
            border: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
        }}>
            {/* Background Heatmap */}
            <FarmHeatmap points={heatmapData} />
            
            {/* Route Trail */}
            <RouteTrail points={trailPoints} progressIndex={trailPoints.length - 1} />
            
            {/* Live Tractor Marker */}
            {currentPoint && currentPoint.lat !== undefined && currentPoint.lng !== undefined && (
                <TractorMarker
                    lat={currentPoint.lat}
                    lng={currentPoint.lng}
                    rotation={currentPoint.headingDeg}
                />
            )}

            {/* Hardware Telemetry HUD */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
                {currentPoint?.sprayActive && (
                    <div className="bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur shadow-emerald-500/20">
                        <Droplets className="w-3.5 h-3.5" />
                        SPRAYING ACTIVE
                    </div>
                )}

                {currentPoint?.diseaseLabel && (
                    <div className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur shadow-red-500/20 pointer-events-auto" title={`Severity: ${currentPoint.infectionIntensity || 'N/A'}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {currentPoint.diseaseLabel.toUpperCase()} ACCUMULATED
                    </div>
                )}
                
                {currentPoint?.gpsFixQuality !== undefined && (
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur pointer-events-auto ${
                        currentPoint.gpsFixQuality >= 4 
                            ? 'bg-blue-500/90 text-white shadow-blue-500/20' 
                            : currentPoint.gpsFixQuality === 3
                            ? 'bg-yellow-500/90 text-white shadow-yellow-500/20'
                            : 'bg-rose-500/90 text-white shadow-rose-500/20'
                    }`}>
                        {currentPoint.gpsFixQuality < 3 ? <AlertTriangle className="w-3.5 h-3.5" /> : <Satellite className="w-3.5 h-3.5" />}
                        {currentPoint.gpsFixQuality >= 5 ? 'PPK FIXED' 
                         : currentPoint.gpsFixQuality === 4 ? 'DGPS FLOAT' 
                         : currentPoint.gpsFixQuality === 3 ? '3D FIX' 
                         : 'NO FIX'}
                    </div>
                )}
            </div>

            {/* Engineer Diagnostics Toggle */}
            <button 
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="absolute bottom-4 right-4 bg-slate-900/80 text-white p-2.5 rounded-full shadow-lg backdrop-blur hover:bg-slate-800 transition pointer-events-auto border border-slate-700/50"
                title="Toggle Engineer Diagnostics"
            >
                <Activity className="w-5 h-5 text-emerald-400" />
            </button>

            {/* Engineer Diagnostics Drawer */}
            {showDiagnostics && currentPoint && (
                <div className="absolute bottom-16 right-4 w-64 bg-slate-900/95 text-emerald-400 font-mono text-[10px] p-4 rounded-xl shadow-2xl backdrop-blur-md border border-slate-700/50 pointer-events-auto overflow-y-auto max-h-[60vh] z-50">
                    <h3 className="text-white text-xs font-bold mb-2 pb-2 border-b border-slate-700/50 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> RAW EDGE CONTEXT
                    </h3>
                    <div className="space-y-1">
                        {currentPoint.lat !== undefined && <div className="flex justify-between"><span>LAT:</span> <span className="text-white">{currentPoint.lat.toFixed(6)}</span></div>}
                        {currentPoint.lng !== undefined && <div className="flex justify-between"><span>LNG:</span> <span className="text-white">{currentPoint.lng.toFixed(6)}</span></div>}
                        <div className="flex justify-between"><span>SPEED:</span> <span className="text-white">{currentPoint.speedKmph || 0} km/h</span></div>
                        <div className="flex justify-between"><span>HEADING:</span> <span className="text-white">{currentPoint.headingDeg || 0}°</span></div>
                        {currentPoint.diseaseLabel && <div className="flex justify-between"><span>CV TARGET:</span> <span className="text-rose-400 font-bold">{currentPoint.diseaseLabel}</span></div>}
                        {currentPoint.valveStates && <div className="flex justify-between"><span>ACTUATION:</span> <span className="text-emerald-300">[{currentPoint.valveStates.join(',')}]</span></div>}
                        <div className="pt-2 mt-2 border-t border-slate-800 text-slate-500 break-all">
                            {currentPoint.recordedAt.toString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveMap;
