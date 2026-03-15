'use client'

import { useState, useEffect } from 'react'
import { MapIcon, Radio, PlayCircle } from 'lucide-react'
import { TractorMarker } from '@/components/map/tractor-marker'
import { RouteTrail } from '@/components/map/route-trail'
import { HeatLegend } from '@/components/map/heat-legend'
import { ReplayControls } from '@/components/map/replay-controls'
import { LiveMap } from '@/components/heatmap/LiveMap'
import { mockRouteData } from '@/lib/mock-data/telemetry'

export default function MapPage() {
    const [isLive, setIsLive] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeed] = useState(1)
    const [progressIndex, setProgressIndex] = useState(0)

    // Demo IDs
    const demoJobId = 'demo-job-123';
    const demoTractorId = 'swaraj-855-01';

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isPlaying && !isLive) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            if (prefersReducedMotion) {
                setProgressIndex(mockRouteData.length - 1)
                setIsPlaying(false)
                return
            }

            interval = setInterval(() => {
                setProgressIndex((prev) => {
                    if (prev >= mockRouteData.length - 1) {
                        setIsPlaying(false)
                        return prev
                    }
                    return prev + 1
                })
            }, 1000 / speed)
        }
        return () => clearInterval(interval)
    }, [isPlaying, speed, isLive])

    const currentPoint = mockRouteData[progressIndex]

    let rotation = 0
    if (progressIndex < mockRouteData.length - 1 && currentPoint && !isLive) {
        const next = mockRouteData[progressIndex + 1]
        rotation = Math.atan2(next.lng - currentPoint.lng, next.lat - currentPoint.lat) * (180 / Math.PI)
    }

    return (
        <div className="relative h-[calc(100vh-72px)] md:h-screen w-full overflow-hidden" style={{ background: 'var(--background)' }}>
            <HeatLegend />

            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, var(--primary) 0%, transparent 60%)'
            }} />

            <div className="absolute inset-4 md:inset-8 rounded-2xl overflow-hidden shadow-2xl">
                {isLive ? (
                    <LiveMap 
                        jobId={demoJobId} 
                        tractorId={demoTractorId} 
                        isLive={isLive} 
                    />
                ) : (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
                        background: 'color-mix(in srgb, var(--surface) 30%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
                    }}>
                        {currentPoint && (
                            <>
                                <RouteTrail points={mockRouteData} progressIndex={progressIndex} />
                                <TractorMarker
                                    lat={currentPoint.lat}
                                    lng={currentPoint.lng}
                                    rotation={rotation}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                {!isLive && (
                    <ReplayControls
                        isPlaying={isPlaying}
                        onTogglePlay={() => {
                            if (progressIndex >= mockRouteData.length - 1) {
                                setProgressIndex(0)
                            }
                            setIsPlaying(!isPlaying)
                        }}
                        onSpeedChange={setSpeed}
                        speed={speed}
                    />
                )}
                
                {/* Live/Demo Toggle - Production Grade */}
                <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-xl overflow-hidden">
                    <button
                        onClick={() => setIsLive(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                            !isLive 
                                ? 'bg-white/10 text-white' 
                                : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        <PlayCircle className="h-4 w-4" />
                        STATIC REPLAY
                    </button>
                    <button
                        onClick={() => setIsLive(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                            isLive 
                                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' 
                                : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        <Radio className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`} />
                        LIVE TELEMETRY
                    </button>
                </div>
            </div>

            {/* Info panel */}
            <div className="absolute top-4 left-4 z-10 rounded-xl p-4" style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>North Wheat Plot</h2>
                <p className="text-sm flex items-center gap-2 mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    <MapIcon className="h-4 w-4 shrink-0" />
                    12.5 Acres • Tracking Swaraj 855 with KRISHI-EYE
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] pt-2" style={{
                    borderTop: '1px solid var(--border)',
                    color: 'var(--muted-foreground)'
                }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: isLive ? 'var(--info)' : 'var(--muted)' }} />
                    {isLive ? 'Real-time Socket Stream Active' : 'Phase 1 Visualization (Simulated Replay)'}
                </div>
            </div>
        </div>
    )
}
