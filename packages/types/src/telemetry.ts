/**
 * Core interface for a single telemetry point from a tractor.
 * Used for both persistence (PostGIS) and real-time transit.
 */
export interface TelemetryPoint {
  tractorId: string;
  jobId: string;
  recordedAt: string | Date;
  lat: number;
  lng: number;
  speedKmph: number;
  headingDeg: number;
  infectionIntensity: number; // 0-1 for heatmap rendering
  heatWeight: number;        // Radius/intensity weight for heatmap
  progressPercent: number;    // Job progress (0-100)
  extra?: Record<string, any>;
}

/**
 * Payload for live telemetry broadcasts over Socket.io.
 * Includes minimal overhead for real-time performance.
 */
export interface LiveTelemetryPayload {
  tractorId: string;
  jobId: string;
  point: Omit<TelemetryPoint, 'tractorId' | 'jobId'>;
  isDemo?: boolean; // Flag to indicate if the data is simulated
}

/**
 * Socket.io events for the telemetry namespace.
 */
export enum TelemetryEvents {
  LIVE_UPDATE = 'telemetry:live',
  SUBSCRIBE = 'telemetry:subscribe',
  UNSUBSCRIBE = 'telemetry:unsubscribe',
}
