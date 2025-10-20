import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ProjectsClientService } from '../services/projects-client.service';
import { VoiceService } from '../services/voice.service';
import { ChapterDetails, TabType } from '../models/project-details.model';
import { VoiceEntityType, VoiceStatus, getVoiceUIState, canGenerateVoice, VoiceProcess } from '../models/voice.model';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from 'src/app/modules/services/toater.service';
import { AuthType } from 'src/app/core/enums/auth-type.enum';

@Component({
  selector: 'app-chapter-workspace',
  templateUrl: './chapter-workspace.component.html',
  styleUrls: ['./chapter-workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChapterWorkspaceComponent implements OnInit, OnChanges, OnDestroy {
  
  @Input() chapterId!: number;
  @Input() projectId!: number;
  @Input() authType?: number; // User's auth type (3 = Editor)
  @Input() isProjectGenerating = false; // 🔒 Parent blocking: Project is generating
  
  @Output() chapterRenamed = new EventEmitter<{ chapterId: number; newTitle: string }>();
  @Output() chapterDeleted = new EventEmitter<number>();
  @Output() showToast = new EventEmitter<{message: string; type: 'success' | 'error'}>();

  // ========================================
  // 🔹 State
  // ========================================
  chapter: ChapterDetails | null = null;
  isLoadingChapter = true;
  notesVisible = false; // For mobile sidebar toggle
  
  // Rename state
  isRenamingChapter = false;
  renameTitle = '';
  isSubmittingRename = false;

  // Voice Generation state
  voiceProcess$?: Observable<VoiceProcess>;
  voiceState: 'idle' | 'generating' | 'ready' | 'failed' = 'idle';
  canGenerate = false;
  isGenerating = false;
  
  // 🔒 Hierarchical blocking: Track if ANY paragraph is generating
  isAnyParagraphGenerating = false;

  // Audio Player state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  audioProgress = 0;

  // Enums for template
  readonly VoiceStatus = VoiceStatus;
  readonly AuthType = AuthType; // Export enum for template

  // Unsubscribe helper
  private destroy$ = new Subject<void>();
  private voiceService = inject(VoiceService);
  private toastService = inject(ToastrsService);

  constructor(
    private projectsClient: ProjectsClientService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check permissions
    this.canGenerate = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] && this.chapterId) {
      // Stop any playing audio when switching chapters
      const audio = document.querySelector('.chapter-voice-card audio') as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      // Load new chapter
      this.loadChapterDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // 🔸 Load Chapter Details
  // ========================================
  loadChapterDetails(): void {
    this.isLoadingChapter = true;
    this.cdr.markForCheck();
    
    this.projectsClient.getChapterDetails(this.chapterId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapter) => {
          this.chapter = chapter;
          this.isLoadingChapter = false;
          
          // ✅ Always update voice state (even if no process exists)
          this.voiceState = getVoiceUIState(this.chapter);
          
          // Auto-resume polling if voice is being generated
          if (this.chapter?.process) {
            if (this.chapter.process.status === VoiceStatus.Pending || 
                this.chapter.process.status === VoiceStatus.Processing) {
              this.resumeVoiceTracking(this.chapter.process.id);
            }
          }
          
          // Reset audio player state when switching chapters
          this.isPlaying = false;
          this.currentTime = 0;
          this.duration = 0;
          this.audioProgress = 0;
          
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load chapter:', error);
          this.isLoadingChapter = false;
          this.showToast.emit({ message: 'فشل تحميل تفاصيل الفصل', type: 'error' });
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Toggle Notes Sidebar (Mobile)
  // ========================================
  toggleNotesSidebar(): void {
    this.notesVisible = !this.notesVisible;
    this.cdr.markForCheck();
  }

  // ========================================
  // � Update canGenerate with Hierarchical Blocking
  // ========================================
  updateCanGenerate(): void {
    if (!this.chapter) {
      this.canGenerate = false;
      return;
    }

    // Note: We can't directly check paragraphs from service
    // Component needs to track this internally via child components
    // For now, assume isAnyParagraphGenerating is updated by paragraph components
    
    // Can generate if:
    // 1. User has permission (already set to true)
    // 2. Project is NOT generating (parent blocking)
    // 3. Chapter is NOT currently generating
    // 4. No paragraph in this chapter is generating
    this.canGenerate = !this.isProjectGenerating && 
                       !this.isGenerating && 
                       !this.isAnyParagraphGenerating;
  }

  // ========================================
  // �🔸 Rename Chapter
  // ========================================
  startRenaming(): void {
    if (!this.chapter) return;
    this.isRenamingChapter = true;
    this.renameTitle = this.chapter.title;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      const input = document.querySelector('.chapter-rename-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 100);
  }

  cancelRename(): void {
    this.isRenamingChapter = false;
    this.renameTitle = '';
    this.cdr.markForCheck();
  }

  submitRename(): void {
    if (!this.chapter || !this.renameTitle.trim() || this.isSubmittingRename) return;

    this.isSubmittingRename = true;
    this.cdr.markForCheck();

    this.projectsClient.renameChapter(this.chapterId, this.renameTitle.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.chapter) {
            this.chapter.title = this.renameTitle.trim();
          }
          this.chapterRenamed.emit({ 
            chapterId: this.chapterId, 
            newTitle: this.renameTitle.trim() 
          });
          this.showToast.emit({ message: 'تم تحديث اسم الفصل بنجاح', type: 'success' });
          this.cancelRename();
          this.isSubmittingRename = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to rename chapter:', error);
          this.showToast.emit({ message: 'فشل تحديث اسم الفصل', type: 'error' });
          this.isSubmittingRename = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Delete Chapter (Emit to parent for DeleteComponent modal)
  // ========================================
  deleteChapter(): void {
    this.chapterDeleted.emit(this.chapterId);
  }

  // ========================================
  // 🎙️ Voice Generation
  // ========================================

  /**
   * Generate voice for this chapter
   */
  generateVoice(): void {
    // Update canGenerate before checking
    this.updateCanGenerate();
    
    if (!this.canGenerate || this.isGenerating || !this.chapter) {
      return;
    }

    // Double-check blocking conditions
    if (this.isProjectGenerating) {
      this.toastService.showWarning('Cannot generate chapter voice while project voice is generating');
      return;
    }
    
    if (this.isAnyParagraphGenerating) {
      this.toastService.showWarning('Cannot generate chapter voice while a paragraph is generating');
      return;
    }

    this.isGenerating = true;
    this.voiceState = 'generating';
    this.cdr.markForCheck();

    // Start generation
    this.toastService.showInfo('Generating chapter voice... ⏳');
    
    this.voiceService.generateVoice(VoiceEntityType.Chapter, this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (processId) => {
          // Initialize process in chapter
          if (this.chapter) {
            if (!this.chapter.process) {
              this.chapter.process = {
                id: processId,
                status: VoiceStatus.Pending,
                // duration_seconds: null,
                // voice_url: null
              };
            }
            
            // Start tracking
            this.trackVoiceGeneration(processId);
          }
        },
        error: (error) => {
          this.toastService.showError('Failed to generate voice. Please try again.');
          this.voiceState = 'failed';
          this.isGenerating = false;
          this.showToast.emit({ message: 'Failed to generate voice. Please try again.', type: 'error' });
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Track voice generation progress
   */
  private trackVoiceGeneration(processId: number): void {
    this.voiceProcess$ = this.voiceService.trackProcess(
      processId,
      VoiceEntityType.Chapter,
      this.chapterId
    ).pipe(
      tap(process => {
        // Update chapter process
        if (this.chapter) {
          this.chapter.process = process;
        }
        
        // Update UI state
        this.voiceState = getVoiceUIState(this.chapter);
        this.isGenerating = process.status === VoiceStatus.Pending || 
                           process.status === VoiceStatus.Processing;
        
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    );

    // Subscribe to trigger polling
    this.voiceProcess$.subscribe({
      next: (finalProcess) => {
        if (finalProcess.status === VoiceStatus.Completed) {
          this.toastService.showSuccess('Chapter voice generated successfully! 🎉');
          this.showToast.emit({ message: 'Voice generated successfully!', type: 'success' });
        } else if (finalProcess.status === VoiceStatus.Failed) {
          this.toastService.showError('Chapter voice generation failed');
          this.showToast.emit({ message: 'Voice generation failed', type: 'error' });
        }
      },
      error: (error) => {
        this.toastService.showError('Error occurred while tracking generation');
        this.voiceState = 'failed';
        this.isGenerating = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Resume tracking existing voice process
   */
  private resumeVoiceTracking(processId: number): void {
    this.isGenerating = true;
    this.trackVoiceGeneration(processId);
  }

  /**
   * Regenerate voice
   */
  regenerateVoice(): void {
    if (!this.canGenerate || !this.chapter) return;

    // Clear existing process
    if (this.chapter) {
      this.chapter.process = undefined;
    }
    this.voiceState = 'idle';
    this.isGenerating = false;
    
    // Start new generation
    this.generateVoice();
  }

  /**
   * Download voice file
   */
  downloadVoice(): void {
    if (!this.chapter?.voice_url) return;

    const link = document.createElement('a');
    link.href = this.chapter.voice_url;
    link.download = `chapter-${this.chapterId}-voice.mp3`;
    link.click();
  }

  /**
   * Get tooltip text for voice button
   */
  getVoiceTooltip(): string {
    // Update status first
    this.updateCanGenerate();
    
    if (this.isProjectGenerating) {
      return 'Cannot generate - project voice is currently generating';
    }
    if (this.isAnyParagraphGenerating) {
      return 'Cannot generate - a paragraph in this chapter is generating voice';
    }
    if (!this.canGenerate) {
      return 'You need Editor permissions to generate voice';
    }
    if (this.isGenerating) {
      return 'Generating voice...';
    }
    if (this.voiceState === 'ready') {
      return 'Voice ready';
    }
    return 'Generate chapter voice';
  }

  // ========================================
  // 🎵 Audio Player Methods
  // ========================================

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    const audio = document.querySelector('.chapter-voice-card audio') as HTMLAudioElement;
    if (!audio) return;

    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
    } else {
      audio.play();
      this.isPlaying = true;
    }
    this.cdr.markForCheck();
  }

  /**
   * Handle time update
   */
  onTimeUpdate(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    this.currentTime = audio.currentTime;
    this.audioProgress = (audio.currentTime / audio.duration) * 100;
    this.cdr.markForCheck();
  }

  /**
   * Handle metadata loaded
   */
  onMetadataLoaded(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    this.duration = audio.duration;
    this.cdr.markForCheck();
  }

  /**
   * Handle audio ended
   */
  onAudioEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.audioProgress = 0;
    this.cdr.markForCheck();
  }

  /**
   * Format time (seconds to MM:SS)
   */
  formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
