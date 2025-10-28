// ========================================
// 🎙️ Voice Generation Service
// ========================================
// Handles voice generation, adaptive polling, and state management
// Features:
// - Prevents duplicate polling for same entity
// - Adaptive backoff intervals (Paragraph: 2-15s, Chapter: 4-20s, Project: 8-30s)
// - Page Visibility optimization (3× slower when hidden)
// - Auto-resume on component init
// - Complete RxJS cleanup with takeUntilDestroyed

import { Injectable, inject, DestroyRef } from '@angular/core';
import { Observable, timer, throwError, EMPTY, BehaviorSubject, of } from 'rxjs';
import {
  switchMap,
  map,
  catchError,
  takeWhile,
  shareReplay,
  tap,
  retry,
  finalize,
  expand
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectsClientService } from './projects-client.service';
import {
  VoiceEntityType,
  VoiceStatus,
  VoiceProcess,
  PollingState,
  GenerateVoiceRequest,
  getBackoffConfig
} from '../models/voice.model';
import { LandingAuthSessionService } from 'src/app/modules/services/auth-session.service';
import { AuthType } from 'src/app/core/enums/auth-type.enum';

/**
 * 🎙️ Voice Generation Service
 * 
 * Orchestrates voice generation with intelligent polling:
 * - Adaptive backoff based on entity type
 * - Prevents duplicate polling
 * - Page Visibility optimization
 * - Auto-resume from existing processes
 * 
 * Usage:
 * ```typescript
 * voiceService.generateVoice(VoiceEntityType.Paragraph, 123).subscribe(
 *   processId => voiceService.trackProcess(processId, type, entityId).subscribe()
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectsClient = inject(ProjectsClientService);
  private readonly authSession = inject(LandingAuthSessionService);

  // Track active polling to prevent duplicates
  private activePolls = new Map<number, Observable<VoiceProcess>>();

  // Track entity processes to prevent duplicate generation
  private entityProcesses = new Map<string, number>(); // key: `${type}-${entityId}`, value: processId

  // Page Visibility state
  private isDocumentHidden$ = new BehaviorSubject<boolean>(document.hidden);

  constructor() {
    // Monitor page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isDocumentHidden$.next(document.hidden);
      });
    }
  }

  // ========================================
  // 🔐 Permission Check
  // ========================================

  /**
   * Check if current user has permission to use voice features
   * Only Editors (AuthType.Editor = 3) can generate and track voice
   */
  private hasVoicePermission(): boolean {
    const userRole = this.authSession.userRole;
    const hasPermission = userRole === AuthType.Editor;

    if (!hasPermission) {
      console.warn('[VoiceService] Voice features are only available for Editors');
    }

    return hasPermission;
  }

  // ========================================
  // 🎬 Generate Voice
  // ========================================

  /**
   * Start voice generation for an entity
   * Prevents duplicate requests for same entity
   * 
   * @param type Entity type (Project/Chapter/Paragraph)
   * @param entityId Entity ID
   * @param voiceKey Optional voice key selected from modal
   * @returns Observable with process ID
   */
  generateVoice(
    type: VoiceEntityType,
    entityId: number,
    voiceKey?: string,
    silences?: { paragraph?: number; chapterTitle?: number; chapter?: number }
  ): Observable<number> {
    if (!this.hasVoicePermission()) {
      return throwError(() => new Error('Unauthorized: Only Editors can generate voice'));
    }

    const key = this.getEntityKey(type, entityId);
    const existingProcessId = this.entityProcesses.get(key);
    if (existingProcessId && this.activePolls.has(existingProcessId)) {
      console.warn(`[VoiceService] Already generating voice for ${key}`);
      return of(existingProcessId);
    }

    const request: any = {
      id: entityId,
      type,
      ...(voiceKey && { voice_key: voiceKey }),
      ...(silences?.paragraph && { paragraph_silence: silences.paragraph }),
      ...(silences?.chapterTitle && { chapter_title_silence: silences.chapterTitle }),
      ...(silences?.chapter && { chapter_silence: silences.chapter })
    };

    // اختر endpoint المشروع
    return this.projectsClient.generateVoice(request).pipe(
      tap((processId) => {
        console.log(`[VoiceService] Voice generation started: process ${processId} for ${key}`);
        this.entityProcesses.set(key, processId);
      }),
      catchError((error) => {
        console.error(`[VoiceService] Failed to generate voice for ${key}:`, error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // 📊 Track Process (Adaptive Polling)
  // ========================================

  /**
   * Poll voice generation status with adaptive backoff
   * Automatically adjusts polling interval based on entity type
   * Slows down 3× when page is hidden
   * 
   * @param processId Process ID to track
   * @param type Entity type (for backoff config)
   * @param entityId Entity ID (for cleanup)
   * @returns Observable that emits VoiceProcess updates
   */

trackProcess(processId: number, type: VoiceEntityType, entityId: number): Observable<VoiceProcess> {
  if (!this.hasVoicePermission()) return EMPTY;

  const key = this.getEntityKey(type, entityId);

  if (this.activePolls.has(processId)) {
    console.log(`[VoiceService] Already polling process ${processId}`);
    return this.activePolls.get(processId)!;
  }

  const backoffConfig = getBackoffConfig(type);
  let attemptIndex = 0;

  const poll$ = timer(0).pipe(
    switchMap(() => this.projectsClient.getVoiceStatus(processId)),
    map(response => {
      if (!response.success || !response.data) throw new Error('Invalid response from voice status API');
      return response.data as VoiceProcess;
    }),
    // ⬇️ هنا السحر: نستخدم expand لتكرار الاستدعاء بدلاً من recursion
    expand((process) => {
      attemptIndex++;
      const shouldContinue =
        process.status === VoiceStatus.Pending ||
        process.status === VoiceStatus.Processing;

      if (!shouldContinue) return EMPTY;

      const interval = backoffConfig.intervals[Math.min(attemptIndex, backoffConfig.intervals.length - 1)];
      const visibilityMultiplier = this.isDocumentHidden$.value ? 3 : 1;
      const currentInterval = interval * visibilityMultiplier;

      return timer(currentInterval).pipe(
        switchMap(() => this.projectsClient.getVoiceStatus(processId)),
        map(r => r.data as VoiceProcess),
        catchError(err => {
          console.error('[VoiceService] Poll error:', err);
          const failedProcess: VoiceProcess = {
            id: processId,
            status: VoiceStatus.Failed,
            error_message: err.message || 'Polling failed'
          };
          return of(failedProcess);
        })
      );
    }),
    // ⬆️ expand راح يخلي الـ stream يطلع كل تحديث
    takeWhile(p => p.status === VoiceStatus.Pending || p.status === VoiceStatus.Processing, true),
    finalize(() => {
      this.activePolls.delete(processId);
      this.entityProcesses.delete(key);
      console.log(`[VoiceService] Cleaned up polling for process ${processId}`);
    }),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef)
  );

  this.activePolls.set(processId, poll$);
  return poll$;
}


  // ========================================
  // 🔄 Resume From Entity
  // ========================================

  /**
   * Resume polling for an existing process
   * Called on component init when entity has active process
   * 
   * @param type Entity type
   * @param entityId Entity ID
   * @param processId Existing process ID
   * @returns Observable with process updates
   */
  resumeFromEntity(type: VoiceEntityType, entityId: number, processId: number): Observable<VoiceProcess> {
    // 🔒 Check permission first
    if (!this.hasVoicePermission()) {
      console.warn('[VoiceService] Unauthorized attempt to resume voice process');
      return EMPTY; // Return empty observable - no polling
    }

    const key = this.getEntityKey(type, entityId);
    console.log(`[VoiceService] Resuming polling for ${key}, Process ${processId}`);

    // Register this entity-process mapping
    this.entityProcesses.set(key, processId);

    // Start tracking
    return this.trackProcess(processId, type, entityId);
  }

  // ========================================
  // 🧹 Utilities
  // ========================================

  /**
   * Generate unique key for entity
   */
  private getEntityKey(type: VoiceEntityType, entityId: number): string {
    return `${type}-${entityId}`;
  }

  /**
   * Check if entity is currently being processed
   */
  isGenerating(type: VoiceEntityType, entityId: number): boolean {
    const key = this.getEntityKey(type, entityId);
    const processId = this.entityProcesses.get(key);
    return processId !== undefined && this.activePolls.has(processId);
  }

  /**
   * Get current process ID for entity (if any)
   */
  getProcessId(type: VoiceEntityType, entityId: number): number | undefined {
    const key = this.getEntityKey(type, entityId);
    return this.entityProcesses.get(key);
  }

  /**
   * Cancel polling for a process (if needed)
   * Note: Observable cleanup handled by takeUntilDestroyed automatically
   */
  cancelProcess(processId: number): void {
    this.activePolls.delete(processId);

    // Remove from entity mapping
    for (const [key, pid] of this.entityProcesses.entries()) {
      if (pid === processId) {
        this.entityProcesses.delete(key);
        break;
      }
    }

    console.log(`[VoiceService] Cancelled process ${processId}`);
  }

  /**
   * Clear all state (call on service destroy if needed)
   */
  clearAll(): void {
    this.activePolls.clear();
    this.entityProcesses.clear();
    console.log('[VoiceService] Cleared all state');
  }

  // ========================================
  // 🔒 Hierarchical Blocking Helpers
  // ========================================

  /**
   * Check if ANY child entity (Chapter or Paragraph) in a project is generating
   * Used by Project component to block its own voice generation
   */
  hasActiveProcessInProject(projectId: number): boolean {
    // Check if any Chapter is generating
    for (const key of this.entityProcesses.keys()) {
      if (key.startsWith(`${VoiceEntityType.Chapter}-`)) {
        const processId = this.entityProcesses.get(key);
        if (processId && this.activePolls.has(processId)) {
          return true;
        }
      }
      // Check if any Paragraph is generating
      if (key.startsWith(`${VoiceEntityType.Paragraph}-`)) {
        const processId = this.entityProcesses.get(key);
        if (processId && this.activePolls.has(processId)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if Project is generating (blocks ALL children)
   */
  isProjectGenerating(projectId: number): boolean {
    return this.isGenerating(VoiceEntityType.Project, projectId);
  }

  /**
   * Check if Chapter is generating (blocks its paragraphs)
   */
  isChapterGenerating(chapterId: number): boolean {
    return this.isGenerating(VoiceEntityType.Chapter, chapterId);
  }
}
