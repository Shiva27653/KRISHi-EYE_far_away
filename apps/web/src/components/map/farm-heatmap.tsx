'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tractor, Info, Clock, CheckCircle2, RotateCcw, X } from 'lucide-react';

type HealthClass = 'Healthy' | 'Fungi' | 'Bacteria' | 'Virus' | 'Phytophthora' | 'Pests' | 'Nematodes';
type PlotState = 'unscanned' | 'scanned' | 'treated';

const HEALTH_COLORS: Record<HealthClass, string> = {
  Healthy: '#10B981',
  Fungi: '#F59E0B',
  Bacteria: '#F59E0B',
  Virus: '#EC4899',
  Phytophthora: '#EC4899',
  Pests: '#EF4444',
  Nematodes: '#EF4444',
};

const HEALTH_PATTERNS: Record<string, string> = {
  Healthy: '●',
  Fungi: '◆',
  Bacteria: '◆',
  Virus: '▲',
  Phytophthora: '▲',
  Pests: '■',
  Nematodes: '■',
};

const CORE_STATES = {
    HEALTHY: { label: 'Healthy', color: '#10B981', pattern: '●' },
    STRESS: { label: 'Suspected Stress', color: '#F59E0B', pattern: '◆' },
    INFECTED: { label: 'Infected / Requires Treatment', color: '#EF4444', pattern: '■' }
};

interface Plot {
  id: string;
  x: number;
  y: number;
  health: HealthClass;
  state: PlotState;
}

const ROWS = 7;
const COLS = 16;
const ROAD_ROW = 3;
const TICK_MS = 600;

function generatePlots(): Plot[] {
  const plots: Plot[] = [];
  const classes: HealthClass[] = ['Healthy', 'Healthy', 'Healthy', 'Healthy', 'Fungi', 'Bacteria', 'Pests', 'Nematodes', 'Phytophthora', 'Virus'];
  
  for (let y = 0; y < ROWS; y++) {
    const isRoad = y === ROAD_ROW;
    for (let x = 0; x < COLS; x++) {
      if (isRoad) {
        plots.push({ id: `${x}-${y}`, x, y, health: 'Healthy', state: 'scanned' });
        continue;
      }
      const isAnomaly = Math.random() > 0.85;
      const randomClass = isAnomaly ? classes[Math.floor(Math.random() * classes.length)] : 'Healthy';
      plots.push({ id: `${x}-${y}`, x, y, health: randomClass, state: 'unscanned' });
    }
  }
  return plots;
}

export function FarmHeatmap({ points }: { points?: any[] }) {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [tractorPos, setTractorPos] = useState({ x: 0, y: ROAD_ROW });
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sectionNumber, setSectionNumber] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tractorPosRef = useRef({ x: 0, y: ROAD_ROW });

  // Mobile tap takes priority over desktop hover
  const inspectedPlot = selectedPlot || hoveredPlot;

  // Initialize
  useEffect(() => {
    setPlots(generatePlots());
  }, []);

  // Tractor movement & scanning
  useEffect(() => {
    if (plots.length === 0) return;

    const interval = setInterval(() => {
      setTractorPos(prev => {
        let { x, y } = prev;
        x += 1;
        
        // At end of field: reset for next section
        if (x >= COLS) {
          x = 0;
          // Trigger section transition
          setIsTransitioning(true);
          setSectionNumber(s => s + 1);
          // Generate fresh field data for "next plot"
          setPlots(generatePlots());
          // Clear transition after a brief moment
          setTimeout(() => setIsTransitioning(false), 400);
        }

        tractorPosRef.current = { x, y };
        return { x, y };
      });
      setLastUpdated(new Date());

      // Update plot states based on tractor position
      setPlots(currentPlots => {
        const tPos = tractorPosRef.current;
        return currentPlots.map(plot => {
          let newState = plot.state;
          
          const dy = plot.y - tPos.y;
          const isInBoomSwath = plot.x === tPos.x && Math.abs(dy) <= 3 && dy !== 0;

          if (isInBoomSwath) {
             newState = plot.health !== 'Healthy' ? 'treated' : 'scanned';
          }

          const isInHorizontalPath = Math.abs(dy) <= 3;
          if (isInHorizontalPath && plot.y !== tPos.y) {
             if (plot.x <= tPos.x) {
                 newState = newState === 'treated' ? 'treated' : 'scanned';
             }
          }

          return { ...plot, state: newState };
        });
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [plots.length]);

  const scannedCount = plots.filter(p => p.state !== 'unscanned' && p.y !== ROAD_ROW).length;
  const treatedCount = plots.filter(p => p.state === 'treated').length;
  const totalCropPlots = plots.filter(p => p.y !== ROAD_ROW).length;

  return (
    <Card className="w-full overflow-hidden flex flex-col h-full" style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg)',
      color: 'var(--foreground)'
    }}>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            Field Scan & Boom Progress
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold" style={{
              borderColor: 'var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)'
            }}>
              LIVE (Simulated Feed)
            </span>
          </CardTitle>
          <CardDescription className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Section {sectionNumber} — Row-based detection and automated spray treatment
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
            <span className="font-mono mr-1" style={{ color: 'var(--foreground)' }}>{scannedCount}/{totalCropPlots}</span> Scanned
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
            <span className="font-mono mr-1" style={{ color: 'var(--success)' }}>{treatedCount}</span> Treated
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
            <Clock className="w-3 h-3 mr-1.5" />
            {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col md:flex-row h-full">
        {/* Heatmap Grid */}
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center relative overflow-hidden min-h-[400px]" style={{ background: 'var(--background)' }}>
          {/* Section transition overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{
              background: 'color-mix(in srgb, var(--background) 80%, transparent)'
            }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--primary)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Moving to Section {sectionNumber}...
              </div>
            </div>
          )}
          <div 
            className="grid gap-1 w-full max-w-4xl" 
            style={{ 
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              aspectRatio: `${COLS}/${ROWS}`,
              opacity: isTransitioning ? 0.3 : 1,
              transition: 'opacity 300ms ease'
            }}
          >
            {plots.map(plot => {
              const hasTractor = plot.x === tractorPos.x && plot.y === tractorPos.y;
              const isRoad = plot.y === ROAD_ROW;
              
              let bgColor = 'var(--surface)';
              if (isRoad) {
                bgColor = 'transparent';
              } else if (plot.state === 'scanned') {
                bgColor = HEALTH_COLORS[plot.health];
              } else if (plot.state === 'treated') {
                bgColor = '#92400E';
              }

              return (
                <div
                  key={plot.id}
                  onMouseEnter={() => setHoveredPlot(plot)}
                  onMouseLeave={() => setHoveredPlot(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlot(prev => prev?.id === plot.id ? null : plot);
                  }}
                  className={`
                    relative w-full h-full cursor-pointer flex items-center justify-center
                    transition-all duration-700
                    ${isRoad ? 'rounded-none' : 'rounded-full scale-95'}
                    ${plot.state === 'unscanned' && !isRoad ? 'opacity-30' : 'opacity-100'}
                    ${selectedPlot?.id === plot.id ? 'ring-2 ring-offset-1' : ''}
                  `}
                  style={{
                    backgroundColor: bgColor,
                    borderTop: isRoad ? '1px solid var(--border)' : undefined,
                    borderBottom: isRoad ? '1px solid var(--border)' : undefined,
                    touchAction: 'manipulation',
                    ...(selectedPlot?.id === plot.id ? { ringColor: 'var(--primary)' } : {}),
                  }}
                >
                  {hasTractor && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center overflow-visible z-50">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[750%] w-1 bg-sky-400 shadow-[0_0_20px_#38BDF8] z-40 opacity-80" />
                        <div className="rounded p-1 z-50 relative ml-[-100%] border-2 border-slate-600" style={{
                          background: 'color-mix(in srgb, var(--card) 80%, transparent)',
                          boxShadow: 'var(--shadow-lg)'
                        }}>
                            <Tractor className="w-6 h-6 drop-shadow-md" style={{ color: 'var(--foreground)' }} />
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend & Details Sidebar */}
        <div className="w-full md:w-72 p-6 flex flex-col gap-6 z-10 shrink-0" style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderLeft: undefined,
        }}>
          
          <div className="space-y-4">
            <div>
               <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Detected Threats</h4>
               <p className="text-xs mt-1 mb-3" style={{ color: 'var(--muted-foreground)' }}>Found by camera, awaiting boom path.</p>
            </div>
            
            <div className="space-y-3">
              {Object.values(CORE_STATES).map((state) => (
                 <div key={state.label} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: state.color }}>
                      {state.pattern}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{state.label}</span>
                 </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
             <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Map Overlay</h4>
             <div className="grid gap-3 text-sm">
                 <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-sm shrink-0" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
                     <span style={{ color: 'var(--muted-foreground)' }}>Unscanned Area</span>
                 </div>
                  <div className="flex items-center gap-3">
                     <div className="w-4 h-4 bg-sky-400 rounded-sm shrink-0" />
                     <span style={{ color: 'var(--muted-foreground)' }}>Boom Coverage Area</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-sm shrink-0" style={{ background: 'var(--danger)' }} />
                     <span style={{ color: 'var(--muted-foreground)' }}>Detected Anomaly</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--danger) 40%, transparent)', border: '1px solid var(--border)' }}>
                        <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                     </div>
                     <span style={{ color: 'var(--muted-foreground)' }}>Treated Swath</span>
                  </div>
             </div>
          </div>

          {/* Plot Inspector — FIXED HEIGHT to prevent layout jitter */}
          <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Plot Inspector</h4>
            <div className="min-h-[88px]">
              {inspectedPlot && inspectedPlot.y !== ROAD_ROW ? (
                <div className="space-y-3 p-3 rounded-lg" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                  {selectedPlot && (
                    <button
                      onClick={() => setSelectedPlot(null)}
                      className="float-right p-1 rounded-md touch-target flex items-center justify-center"
                      style={{ color: 'var(--muted-foreground)', background: 'var(--surface-hover)' }}
                      aria-label="Clear selection"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Location</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: 'var(--foreground)', background: 'var(--background)', border: '1px solid var(--border)' }}>
                      R{inspectedPlot.y + 1} &times; C{inspectedPlot.x + 1}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Diagnosis</span>
                    {inspectedPlot.state === 'unscanned' ? (
                       <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--muted-foreground)' }}>PENDING SCAN</span>
                    ) : (
                       <span className="inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs font-semibold" style={{
                         borderColor: HEALTH_COLORS[inspectedPlot.health],
                         color: inspectedPlot.state === 'treated' ? 'var(--muted-foreground)' : HEALTH_COLORS[inspectedPlot.health]
                       }}>
                        {HEALTH_PATTERNS[inspectedPlot.health]} {inspectedPlot.health} {inspectedPlot.state === 'treated' && '(Treated)'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm italic p-3 rounded-lg" style={{
                  color: 'var(--muted-foreground)',
                  background: 'var(--surface-alt)',
                  border: '1px dashed var(--border)'
                }}>
                  <Info className="w-4 h-4 shrink-0" />
                  Tap or hover over map to inspect
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
