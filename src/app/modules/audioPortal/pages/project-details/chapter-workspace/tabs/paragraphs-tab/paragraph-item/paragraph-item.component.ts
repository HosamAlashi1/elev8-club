import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ProjectsClientService } from '../../../../services/projects-client.service';
import { VoiceService } from '../../../../services/voice.service';
import { ParagraphItem } from '../../../../models/project-details.model';
import { VoiceEntityType, VoiceStatus, getVoiceUIState, canGenerateVoice, VoiceProcess } from '../../../../models/voice.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';
import { ToastrsService } from 'src/app/modules/services/toater.service';
import { AuthType } from 'src/app/core/enums/auth-type.enum';

@Component({
  selector: 'app-paragraph-item',
  templateUrl: './paragraph-item.component.html',
  styleUrls: ['./paragraph-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParagraphItemComponent implements OnInit, OnDestroy {
  
  @Input() paragraph!: ParagraphItem;
  @Input() chapterId!: number;
  @Input() authType?: number; // User's auth type (3 = Editor)
  @Input() isProjectGenerating = false; // 🔒 Parent blocking: Project is generating
  @Input() isChapterGenerating = false; // 🔒 Parent blocking: Chapter is generating
  
  @Output() edited = new EventEmitter<ParagraphItem>();
  @Output() deleted = new EventEmitter<number>();

  // Edit state
  isEditing = false;
  editText = '';
  isSubmitting = false;

  // Copy state
  isCopied = false;

  // Expand state (for long text)
  isExpanded = false;
  needsExpansion = false;

  // Voice Generation state
  voiceProcess$?: Observable<VoiceProcess>;
  voiceState: 'idle' | 'generating' | 'ready' | 'failed' = 'idle';
  canGenerate = false;
  isGenerating = false;

  // Audio Player state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  audioProgress = 0;

  // Enums for template
  readonly VoiceStatus = VoiceStatus;
  readonly AuthType = AuthType; // Export enum for template

  private destroy$ = new Subject<void>();
  private voiceService = inject(VoiceService);
  private toastService = inject(ToastrsService);

  constructor(
    private projectsClient: ProjectsClientService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Debug: Log authType
    console.log('[ParagraphItem] Auth Type:', this.authType, 'Editor Type:', AuthType.Editor);
    
    // Update canGenerate based on hierarchical blocking
    this.updateCanGenerate();

    // Initialize voice state
    if (this.paragraph.process) {
      this.voiceState = getVoiceUIState(this.paragraph);

      // Auto-resume polling if Pending or Processing
      if (this.paragraph.process.status === VoiceStatus.Pending || 
          this.paragraph.process.status === VoiceStatus.Processing) {
        this.resumeVoiceTracking(this.paragraph.process.id);
      }
    }
  }

  // ========================================
  // 🔒 Update canGenerate with Hierarchical Blocking
  // ========================================
  updateCanGenerate(): void {
    // Can generate if:
    // 1. User has permission (Editor = 3)
    // 2. Project is NOT generating (blocks all children)
    // 3. Chapter is NOT generating (blocks its paragraphs)
    // 4. Paragraph itself is NOT currently generating
    this.canGenerate = !this.isProjectGenerating && 
                       !this.isChapterGenerating && 
                       !this.isGenerating;
  }

  ngAfterViewInit(): void {
    // Check if text needs expansion (more than 8 lines)
    setTimeout(() => {
      const textElement = document.querySelector(`#para-${this.paragraph.id} .paragraph-text`);
      if (textElement) {
        const lineHeight = parseInt(window.getComputedStyle(textElement).lineHeight);
        const maxHeight = lineHeight * 8; // 8 lines
        this.needsExpansion = textElement.scrollHeight > maxHeight;
        this.cdr.markForCheck();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // 🔸 Expand/Collapse
  // ========================================
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck();
  }

  // ========================================
  // 🔸 Inline Edit
  // ========================================
  startEdit(): void {
    this.isEditing = true;
    this.editText = this.paragraph.text;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      const textarea = document.querySelector(`#edit-para-${this.paragraph.id}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 100);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editText = '';
    this.cdr.markForCheck();
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.submitEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  submitEdit(): void {
    if (!this.editText.trim() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.projectsClient.editParagraph(this.paragraph.id, this.editText.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          // Update paragraph text locally (API returns null in data)
          this.paragraph.text = this.editText.trim();
          this.edited.emit(this.paragraph);
          this.isEditing = false;
          this.isSubmitting = false;
          this.cdr.markForCheck();

          // Refocus on Edit button (Accessibility)
          setTimeout(() => {
            const editBtn = document.querySelector(`#edit-btn-${this.paragraph.id}`) as HTMLButtonElement;
            editBtn?.focus();
          }, 100);
        },
        error: (error) => {
          console.error('Failed to edit paragraph:', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Copy to Clipboard (with visual feedback)
  // ========================================
  async copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.paragraph.text);
      
      // Show "Copied!" feedback
      this.isCopied = true;
      this.cdr.markForCheck();
      
      // Reset after 2 seconds
      setTimeout(() => {
        this.isCopied = false;
        this.cdr.markForCheck();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  // ========================================
  // 🔸 Word Count Helper
  // ========================================
  getWordCount(): number {
    if (!this.editText || !this.editText.trim()) return 0;
    return this.editText.trim().split(/\s+/).length;
  }

  // ========================================
  // 🔸 Delete with Modal
  // ========================================
  openDeleteModal(): void {
    const modalRef = this.modalService.open(DeleteComponent, { 
      centered: true,
    });
    
    modalRef.componentInstance.title = 'Delete Paragraph';
    modalRef.componentInstance.message = 'Are you sure you want to delete this paragraph? This action cannot be undone.';
    modalRef.componentInstance.type = 'paragraph';
    modalRef.componentInstance.id = this.paragraph.id;
    modalRef.result.then(
      (confirmed) => {
        if (confirmed) {
          this.deleteParagraph();
        }
      },
      () => {} // Dismissed
    );
  }

  deleteParagraph(): void {
    this.projectsClient.deleteParagraph(this.paragraph.id, this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleted.emit(this.paragraph.id);
        },
        error: (error) => {
          console.error('Failed to delete paragraph:', error);
        }
      });
  }

  // ========================================
  // 🎙️ Voice Generation
  // ========================================

  /**
   * Generate voice for this paragraph
   */
  generateVoice(): void {
    // Update canGenerate before checking
    this.updateCanGenerate();
    
    if (!this.canGenerate || this.isGenerating) {
      return;
    }

    // Double-check blocking conditions
    if (this.isProjectGenerating) {
      this.toastService.showWarning('Cannot generate - project voice is currently generating');
      return;
    }
    
    if (this.isChapterGenerating) {
      this.toastService.showWarning('Cannot generate - chapter voice is currently generating');
      return;
    }

    this.isGenerating = true;
    this.voiceState = 'generating';
    this.cdr.markForCheck();

    // Start generation
    this.voiceService.generateVoice(VoiceEntityType.Paragraph, this.paragraph.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (processId) => {
          this.toastService.showInfo('Generating voice... ⏳');
          
          // Initialize process in paragraph
          if (!this.paragraph.process) {
            this.paragraph.process = {
              id: processId,
              status: VoiceStatus.Pending,
              // duration_seconds: null,
              // voice_url: null
            };
          }

          // Start tracking
          this.trackVoiceGeneration(processId);
        },
        error: (error) => {
          console.error('[ParagraphItem] Failed to start voice generation:', error);
          this.voiceState = 'failed';
          this.isGenerating = false;
          this.cdr.markForCheck();
          
          this.toastService.showError('Failed to generate voice. Please try again.');
        }
      });
  }

  /**
   * Track voice generation progress with polling
   */
  private trackVoiceGeneration(processId: number): void {
    this.voiceProcess$ = this.voiceService.trackProcess(
      processId,
      VoiceEntityType.Paragraph,
      this.paragraph.id
    ).pipe(
      tap(process => {
        console.log(`[ParagraphItem] Voice status update for paragraph ${this.paragraph.id}:`, process.status);
        
        // Update paragraph process
        this.paragraph.process = process;
        
        // Update UI state
        this.voiceState = getVoiceUIState(this.paragraph);
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
          // Success! Voice is ready
          this.toastService.showSuccess('Voice generated successfully! 🎉');
        } else if (finalProcess.status === VoiceStatus.Failed) {
          // Failed
          this.toastService.showError(finalProcess.error_message || 'Voice generation failed');
        }
      },
      error: (error) => {
        console.error('[ParagraphItem] Voice tracking error:', error);
        this.voiceState = 'failed';
        this.isGenerating = false;
        this.cdr.markForCheck();
        this.toastService.showError('Error occurred while tracking generation');
      }
    });
  }

  /**
   * Resume tracking existing voice process
   */
  private resumeVoiceTracking(processId: number): void {
    console.log(`[ParagraphItem] Resuming voice tracking for paragraph ${this.paragraph.id}, Process: ${processId}`);
    
    this.isGenerating = true;
    this.trackVoiceGeneration(processId);
  }

  /**
   * Regenerate voice (if failed or want to replace)
   */
  regenerateVoice(): void {
    if (!this.canGenerate) return;

    // Clear existing process
    this.paragraph.process = undefined;
    this.voiceState = 'idle';
    this.isGenerating = false;
    
    // Start new generation
    this.generateVoice();
  }

  /**
   * Download voice file
   */
  downloadVoice(): void {
    if (!this.paragraph.voice_url) return;

    const link = document.createElement('a');
    link.href = this.paragraph.voice_url;
    link.download = `paragraph-${this.paragraph.id}-voice.mp3`;
    link.click();
  }

  /**
   * Get tooltip text for disabled generate button
   */
  getGenerateTooltip(): string {
    // Update status first
    this.updateCanGenerate();
    
    if (this.isProjectGenerating) {
      return 'Cannot generate - project voice is currently generating';
    }
    if (this.isChapterGenerating) {
      return 'Cannot generate - chapter voice is currently generating';
    }
    if (!this.canGenerate) {
      return 'You need Editor permissions to generate voice';
    }
    if (this.isGenerating) {
      return 'Voice generation in progress...';
    }
    return 'Generate voice for this paragraph';
  }

  // ========================================
  // 🎵 Audio Player Methods
  // ========================================

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    const audio = document.querySelector(`#para-${this.paragraph.id} audio`) as HTMLAudioElement;
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
