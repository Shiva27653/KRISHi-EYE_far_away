// @farmer-platform/types - Single file, zero dependencies, runtime-safe
// Compiled source included in build via Turbopack/NestJS tsc

export interface User {
  id: string;
  phone: string;
  role: 'farmer' | 'admin' | 'judge';
  farmId?: string;
}

export interface LiveTelemetryPayload {
  tractorId: string;
  jobId: string;
  point: {
    lat: number;
    lng: number;
    recordedAt: Date | string;
    speedKmph: number;
    headingDeg: number;
    infectionIntensity: number;
    heatWeight: number;
    progressPercent: number;
  };
  isDemo: boolean;
}

export enum TelemetryEvents {
  SUBSCRIBE = 'telemetry:subscribe',
  UNSUBSCRIBE = 'telemetry:unsubscribe',
  LIVE_UPDATE = 'telemetry:update',
  JOB_START = 'job:start',
  JOB_COMPLETE = 'job:complete'
}

export interface AdvisoryRequest {
  question: string;
  user_id: string;
  farm_id?: string | null;
  field_id?: string | null;
  language?: string;
  crop?: string | null;
  district?: string | null;
  session_id?: string | null;
}

export interface FeedbackRequest {
  answer_id: string;
  user_id: string;
  helpful: boolean;
  comment?: string | null;
}

export interface EscalationRequest {
  answer_id: string;
  user_id: string;
  reason?: string | null;
}

export interface SourceReference {
  source_id: string;
  title: string;
  source_type: string;
  url?: string | null;
  published_at?: string | null;
  updated_date?: string | null;
  relevance_score: number;
}

export interface Farm {
  id: string;
  name: string;
  district: string;
  state: string;
}
