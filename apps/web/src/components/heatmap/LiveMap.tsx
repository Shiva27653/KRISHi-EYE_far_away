'use client'

import React, { useMemo } from 'react';
import { TractorMarker } from '@/components/map/tractor-marker';
import { FarmHeatmap } from '@/components/map/farm-heatmap';
import { RouteTrail } from '@/components/map/route-trail';
import { useTelemetry } from '@/hooks/useTelemetry';

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
        history.map(h => ({
            lat: h.point.lat,
            lng: h.point.lng,
            weight: h.point.heatWeight,
            intensity: h.point.infectionIntensity
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
        </div>
    );
};

export default LiveMap;
