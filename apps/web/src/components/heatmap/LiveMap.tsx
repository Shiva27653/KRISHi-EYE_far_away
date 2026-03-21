'use client'

import React, { useMemo } from 'react';
import { TractorMarker } from '@/components/map/tractor-marker';
import { FarmHeatmap } from '@/components/map/farm-heatmap';
import { RouteTrail } from '@/components/map/route-trail';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Satellite, Droplets, AlertTriangle } from 'lucide-react';

interface LiveMapProps {
    jobId: string;
    tractorId: string;
    isLive: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({ jobId, tractorId, isLive }) => {
    const { latestPoint, history, startSimulation, stopSimulation } = useTelemetry(jobId);

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
        history.map(h => ({ lat: h.point.lat, lng: h.point.lng })), 
    [history]);

    // Format history for FarmHeatmap
    const heatmapData = useMemo(() => 
        history.filter(h => h.point.heatWeight !== undefined && h.point.infectionIntensity !== undefined).map(h => ({
            lat: h.point.lat,
            lng: h.point.lng,
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
            {currentPoint && (
                <TractorMarker
                    lat={currentPoint.lat}
                    lng={currentPoint.lng}
                    rotation={currentPoint.headingDeg}
                />
            )}

            {/* Hardware Telemetry HUD */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                {currentPoint?.sprayActive && (
                    <div className="bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur shadow-emerald-500/20">
                        <Droplets className="w-3.5 h-3.5" />
                        SPRAYING ACTIVE
                    </div>
                )}
                
                {currentPoint?.gpsFixQuality !== undefined && (
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur ${
                        currentPoint.gpsFixQuality >= 4 
                            ? 'bg-blue-500/90 text-white shadow-blue-500/20' 
                            : currentPoint.gpsFixQuality === 3
                            ? 'bg-yellow-500/90 text-white shadow-yellow-500/20'
                            : 'bg-red-500/90 text-white shadow-red-500/20'
                    }`}>
                        {currentPoint.gpsFixQuality < 3 ? <AlertTriangle className="w-3.5 h-3.5" /> : <Satellite className="w-3.5 h-3.5" />}
                        {currentPoint.gpsFixQuality >= 5 ? 'PPK FIXED' 
                         : currentPoint.gpsFixQuality === 4 ? 'DGPS FLOAT' 
                         : currentPoint.gpsFixQuality === 3 ? '3D FIX' 
                         : 'NO FIX'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveMap;
