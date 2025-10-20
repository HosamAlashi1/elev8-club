// ========================================
// 🎙️ Voice Generation Models & Types
// ========================================

/**
 * Voice Process Status
 * 1 = Pending
 * 2 = Processing
 * 3 = Completed
 * 4 = Failed
 */
export enum VoiceStatus {
  Pending = 1,
  Processing = 2,
  Completed = 3,
  Failed = 4
}

/**
 * Entity Type for Voice Generation
 * 1 = Project
 * 2 = Chapter
 * 3 = Paragraph
 */
export enum VoiceEntityType {
  Project = 1,
  Chapter = 2,
  Paragraph = 3
}

/**
 * Voice Process (embedded in entities)
 */
export interface VoiceProcess {
  id: number;
  status: VoiceStatus;
  // duration_seconds: number | null;
  error_message?: string | null;
}

/**
 * Voice Generation Request
 */
export interface GenerateVoiceRequest {
  id: number;
  type: VoiceEntityType;
}

/**
 * Voice Generation Response
 */
export interface GenerateVoiceResponse {
  success: boolean;
  msg: string;
  data: {
    process_id: number;
  };
}

/**
 * Voice Status Response
 */
export interface VoiceStatusResponse {
  success: boolean;
  msg: string;
  data: {
    status: VoiceStatus;
    error_message?: string | null;
  };
}

/**
 * Voice State (UI State)
 */
export type VoiceUIState = 
  | 'idle'       // No process, ready to generate
  | 'generating' // Status 1 or 2
  | 'ready'      // Status 3 with voice_url
  | 'failed';    // Status 4

/**
 * Audio Track (for Audio Dock Queue)
 */
export interface AudioTrack {
  id: string; // Unique identifier: `${type}-${entityId}`
  type: VoiceEntityType;
  entityId: number;
  title: string;
  voiceUrl: string;
  duration: number | null;
}

/**
 * Polling State (internal)
 */
export interface PollingState {
  processId: number;
  entityType: VoiceEntityType;
  entityId: number;
  retryCount: number;
  isActive: boolean;
}

/**
 * Backoff Configuration
 */
export interface BackoffConfig {
  initial: number;
  multiplier: number;
  max: number;
  intervals: number[]; // Pre-calculated intervals
}

/**
 * Get Backoff Config by Entity Type
 */
export function getBackoffConfig(type: VoiceEntityType): BackoffConfig {
  switch (type) {
    case VoiceEntityType.Paragraph:
      return {
        initial: 2000,
        multiplier: 1.5,
        max: 15000,
        intervals: [2000, 3000, 5000, 8000, 13000, 15000]
      };
    case VoiceEntityType.Chapter:
      return {
        initial: 4000,
        multiplier: 1.5,
        max: 20000,
        intervals: [4000, 6000, 10000, 14000, 20000]
      };
    case VoiceEntityType.Project:
      return {
        initial: 8000,
        multiplier: 1.5,
        max: 30000,
        intervals: [8000, 12000, 18000, 26000, 30000]
      };
  }
}

/**
 * Get UI State from Entity (Project/Chapter/Paragraph)
 * Now accepts the full entity (paragraph/chapter/project) to check voice_url
 */
export function getVoiceUIState(entity: any | null | undefined): VoiceUIState {
  // If no entity, return idle
  if (!entity) return 'idle';
  
  // If entity has voice_url directly (new backend structure), it's ready
  if (entity.voice_url) return 'ready';
  
  // Check process status if exists
  if (!entity.process) return 'idle';
  
  switch (entity.process.status) {
    case VoiceStatus.Pending:
    case VoiceStatus.Processing:
      return 'generating';
    case VoiceStatus.Completed:
      // Check voice_url in entity first, then in process (backward compatibility)
      return (entity.voice_url || entity.process?.voice_url) ? 'ready' : 'idle';
    case VoiceStatus.Failed:
      return 'failed';
    default:
      return 'idle';
  }
}

/**
 * Check if User can Generate (auth_type === 3)
 */
export function canGenerateVoice(authType: number | undefined): boolean {
  return authType === 3;
}
