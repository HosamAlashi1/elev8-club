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
import { VoiceSelectionModalComponent } from '../../../../../../../components/voice-selection-modal/voice-selection-modal.component';
import { AudioCoordinatorService } from 'src/app/modules/services/audio-coordinator.service';
import { ChapterSyncService } from 'src/app/modules/services/chapter-sync.service';

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
  @Input() reorderMode = false;

  @Output() edited = new EventEmitter<ParagraphItem>();
  @Output() deleted = new EventEmitter<number>();

  isCompactView = false;

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
  private audioCoordinator = inject(AudioCoordinatorService);


  // Audio Player state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  audioProgress = 0;

  // أعلى الكلاس:
  lastFailureMessage: string | null = null;
  get hasFailed(): boolean { return !!this.lastFailureMessage; }


  // Enums for template
  readonly VoiceStatus = VoiceStatus;
  readonly AuthType = AuthType; // Export enum for template

  private destroy$ = new Subject<void>();
  private voiceService = inject(VoiceService);
  private toastService = inject(ToastrsService);

  private chapterSync = inject(ChapterSyncService);

  // Action menu state
  showTitleMenu = false;
  showParaMenu = false;

  constructor(
    private projectsClient: ProjectsClientService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updateCanGenerate();

    this.voiceState = getVoiceUIState(this.paragraph);

    if (this.paragraph.process) {
      if (this.paragraph.process.status === VoiceStatus.Pending ||
        this.paragraph.process.status === VoiceStatus.Processing) {
        this.resumeVoiceTracking(this.paragraph.process.id);
      } else if (this.paragraph.process.status === VoiceStatus.Failed) {
        //  هيك الزر يطلع Regenerate فورًا
        this.handleProcessFailure(this.paragraph.process?.error_message || 'Generation failed');
      }
    }

    // 🔔 اشترك في حدث إيقاف الصوت من AudioCoordinator
    this.audioCoordinator.onAudioPaused$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pausedAudio => {
        const myAudio = document.querySelector(`#para-${this.paragraph.id} audio`) as HTMLAudioElement;
        if (myAudio && myAudio === pausedAudio) {
          // الصوت تبعي توقف من برّا
          this.isPlaying = false;
          this.cdr.markForCheck();
        }
      });

    this.chapterSync.titleChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(evt => {
        if (
          evt.origin === 'sidebar' &&
          this.paragraph.is_title &&
          evt.chapterId === this.chapterId
        ) {
          this.paragraph.text = evt.newTitle;
          if (this.isEditing) {
            this.editText = evt.newTitle; // لو كنت فاتح إدخال تعديل
          }
          this.cdr.markForCheck();
        }
      });

    this.checkViewport();
    window.addEventListener('resize', this.checkViewport.bind(this));

    document.addEventListener('click', this.closeMenus, true);
  }

  private checkViewport(): void {
    this.isCompactView = window.innerWidth < 1480;
  }

  seekAudio(event: MouseEvent): void {
    if (this.reorderMode) return;
    const audio = document.querySelector(`#para-${this.paragraph.id} audio`) as HTMLAudioElement;
    const track = event.currentTarget as HTMLElement;

    if (!audio || !this.duration) return;

    // احسب النسبة بين موقع النقر وطول الشريط
    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.min(Math.max(clickX / rect.width, 0), 1);

    // حدّد الزمن الجديد
    const newTime = percentage * this.duration;
    audio.currentTime = newTime;

    // حدّث واجهة التقدّم
    this.currentTime = newTime;
    this.audioProgress = percentage * 100;
    this.cdr.markForCheck();
  }

  // ========================================
  // 🔒 Update canGenerate with Hierarchical Blocking
  // ========================================
  updateCanGenerate(): void {
    this.canGenerate = !this.reorderMode &&
      !this.isProjectGenerating &&
      !this.isChapterGenerating &&
      !this.isGenerating;
  }


  ngAfterViewInit(): void {
    if (this.reorderMode) return;
    setTimeout(() => {
      const textElement = document.querySelector(`#para-${this.paragraph.id} .paragraph-text`);
      if (textElement) {
        const lineHeight = parseInt(window.getComputedStyle(textElement).lineHeight);
        const maxHeight = lineHeight * 8;
        this.needsExpansion = textElement.scrollHeight > maxHeight;
        this.cdr.markForCheck();
      }
    }, 100);
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.checkViewport.bind(this));
    document.removeEventListener('click', this.closeMenus, true);
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
    if (this.reorderMode) return;
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
    if (this.reorderMode) return;
    if (!this.editText.trim() || this.isSubmitting) return;
    this.isSubmitting = true; this.cdr.markForCheck();

    this.projectsClient.editParagraph(this.paragraph.id, this.editText.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // عدّل محليًا
          this.paragraph.text = this.editText.trim();
          this.edited.emit(this.paragraph);
          this.isEditing = false;
          this.isSubmitting = false;
          this.cdr.markForCheck();

          //  لو هاي فقرة العنوان → بلّغ السايدبار فورًا
          if (this.paragraph.is_title) {
            this.chapterSync.emitTitleChanged({
              chapterId: this.chapterId,
              newTitle: this.paragraph.text,
              origin: 'paragraph'
            });
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Copy to Clipboard (with visual feedback)
  // ========================================
  async copyText(): Promise<void> {
    if (this.reorderMode) return;
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
    if (this.reorderMode) return;
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
      () => { } // Dismissed
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
    if (this.reorderMode) return;
    this.updateCanGenerate();
    if (!this.canGenerate || this.isGenerating || !this.paragraph) return;

    if (this.isProjectGenerating) {
      this.toastService.showWarning('Cannot generate - project voice is currently generating');
      return;
    }

    if (this.isChapterGenerating) {
      this.toastService.showWarning('Cannot generate - chapter voice is currently generating');
      return;
    }

    // 🎤 فتح مودال اختيار الصوت فقط (بدون أي خيارات صمت)
    const modalRef = this.modalService.open(VoiceSelectionModalComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.entityType = 'paragraph';
    modalRef.componentInstance.defaultVoiceKey = this.paragraph?.voice_key;

    modalRef.result.then(
      (result: any) => {
        if (!result) return;

        const voiceKey = result.key || (typeof result === 'string' ? result : null);
        if (!voiceKey) return;

        console.log(`[ParagraphItem] Selected voice: ${voiceKey}`);
        this.proceedWithVoiceGeneration(voiceKey);
      },
      () => console.log('[ParagraphItem] Voice selection cancelled')
    );
  }

  /**
   * Proceed with voice generation after voice selection
   */
  private proceedWithVoiceGeneration(voiceKey: string): void {
    if (!this.paragraph) return;

    // 🔄 أي محاولة جديدة تلغي رسالة الفشل السابقة
    this.lastFailureMessage = null;
    this.isGenerating = true;
    this.voiceState = 'generating';
    this.cdr.markForCheck();

    this.toastService.showInfo(`Generating paragraph voice... ⏳`);

    this.voiceService
      .generateVoice(VoiceEntityType.Paragraph, this.paragraph.id, voiceKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (processId) => {
          console.log(`[ParagraphItem] Voice generation started (processId=${processId})`);
          this.toastService.showInfo('Generating voice... ⏳');

          if (!this.paragraph.process) {
            this.paragraph.process = { id: processId, status: VoiceStatus.Pending };
          }

          this.trackVoiceGeneration(processId);
        },
        error: (error) => {
          console.error('[ParagraphItem] Failed to start voice generation:', error);
          this.handleProcessFailure(error?.message || 'Failed to start generation');
          this.toastService.showError('Failed to generate voice. Please try again.');
        }
      });
  }


  private trackVoiceGeneration(processId: number): void {
    this.voiceProcess$ = this.voiceService.trackProcess(
      processId, VoiceEntityType.Paragraph, this.paragraph.id
    ).pipe(
      tap(process => {
        console.log(`[ParagraphItem] Voice status p${this.paragraph.id}:`, process.status);

        this.paragraph.process = process;

        // لو فشل… لا تمرّ على failed نهائيًا
        if (process.status === VoiceStatus.Failed) {
          this.handleProcessFailure(process?.error_message || 'Generation failed');
          return; // أوقف تحديثات هذا الـ tap
        }

        // تحديث طبيعي لباقي الحالات
        this.voiceState = getVoiceUIState(this.paragraph);
        this.isGenerating = process.status === VoiceStatus.Pending ||
          process.status === VoiceStatus.Processing;

        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    );

    this.voiceProcess$.subscribe({
      next: (finalProcess) => {
        if (finalProcess.status === VoiceStatus.Completed) {
          this.toastService.showSuccess('Voice generated successfully! 🎉');

          //  Emit to parent to reload paragraphs list with updated voice URLs
          // The parent (paragraphs-tab) should reload chapter details which includes all paragraphs
          this.edited.emit(this.paragraph); // Reuse edited event to trigger refresh
        } else if (finalProcess.status === VoiceStatus.Failed) {
          // (اختياري) توست فقط — الـ UI عولج في tap
          this.toastService.showError(finalProcess.error_message || 'Voice generation failed');
        }
      },
      error: (error) => {
        console.error('[ParagraphItem] Voice tracking error:', error);
        //  ارجع للوضع الجاهز لإعادة المحاولة
        this.handleProcessFailure(error?.message || 'Tracking error');
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
    if (this.reorderMode) return;
    if (!this.canGenerate) return;
    this.paragraph.process = undefined;
    this.voiceState = 'idle';
    this.isGenerating = false;
    this.lastFailureMessage = null;
    this.generateVoice();
  }

  /**
   * Download voice file
   */
  downloadVoice(): void {
    if (this.reorderMode) return;
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
    if (this.reorderMode) return 'Reordering…';
    this.updateCanGenerate();
    if (this.isProjectGenerating) return 'Cannot generate - project voice is currently generating';
    if (this.isChapterGenerating) return 'Cannot generate - chapter voice is currently generating';
    if (!this.canGenerate) return 'You need Editor permissions to generate voice';
    if (this.isGenerating) return 'Voice generation in progress...';
    if (this.voiceState === 'ready') return 'Voice ready';
    if (this.hasFailed) return 'Previous attempt failed — click to regenerate';
    return 'Generate voice for this paragraph';
  }


  // ========================================
  //  Audio Player Methods
  // ========================================

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.reorderMode) return;
    const audio = document.querySelector(`#para-${this.paragraph.id} audio`) as HTMLAudioElement;
    if (!audio) return;

    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
    } else {
      // 🔔 سجل الصوت في AudioCoordinator (راح يوقف أي صوت تاني تلقائي)
      this.audioCoordinator.register(audio);
      audio.play();
      this.isPlaying = true;
    }

    //  هذا السطر هو المفتاح
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
    this.audioCoordinator.stopAll();
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

  // داخل الكلاس:
  private handleProcessFailure(message?: string): void {
    this.isGenerating = false;
    this.voiceState = 'idle';                // 👈 بدل failed
    this.lastFailureMessage = message || 'Unknown error';

    // امسح أي process قديم ليتاح الزر كـ Regenerate
    if (this.paragraph) {
      this.paragraph.process = undefined;
    }

    this.updateCanGenerate();
    this.cdr.markForCheck();
  }

  toggleTitleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showTitleMenu = !this.showTitleMenu;
    this.showParaMenu = false;
  }
  toggleParaMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showParaMenu = !this.showParaMenu;
    this.showTitleMenu = false;
  }

  closeMenus = () => {
    this.showTitleMenu = false;
    this.showParaMenu = false;
  };

  
}
