
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum Emotion {
  Happy = 'Happy',
  Sad = 'Sad',
  Angry = 'Angry',
  Neutral = 'Neutral'
}

export interface TranscriptionSegment {
  speaker: string;
  timestamp: string; // "MM:SS - MM:SS"
  original_transcript: string;
  semantic_correction: string;
  emotion?: Emotion;
  language?: string;
}

export interface TranscriptionResponse {
  summary: string;
  segments: TranscriptionSegment[];
}

export type JobStatus = 'processing' | 'success' | 'error';

export type AppStatus = 'idle' | 'processing' | 'success' | 'error';

export interface Job {
  id: string; // UUID
  status: JobStatus;
  result?: TranscriptionResponse;
  createdAt: number;
  fileName: string;
  duration?: number;
  error?: string;
}

export interface AudioData {
  blob: Blob;
  base64: string; // Kept for backward compatibility if needed, but mainly we use Blob now
  mimeType: string;
}

export type AuthMode = 'session' | 'persistent';

export interface AuthState {
  isAuthenticated: boolean;
  apiKey: string | null;
  mode: AuthMode;
}
