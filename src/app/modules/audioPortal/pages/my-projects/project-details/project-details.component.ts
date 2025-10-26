import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { AudioPlayerService } from 'src/app/modules/services/audio-player.service';
import { VoiceService } from './services/voice.service';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';
import { ProjectDetails, ChapterRef, ProjectDetailsResponse } from './models/project-details.model';
import { VoiceEntityType, VoiceStatus, getVoiceUIState, canGenerateVoice, VoiceProcess } from './models/voice.model';
import { ToastrsService } from 'src/app/modules/services/toater.service';
import { LandingAuthSessionService } from 'src/app/modules/services/auth-session.service';
import { AuthType } from 'src/app/core/enums/auth-type.enum';
import { VoiceSelectionModalComponent } from '../../../components/voice-selection-modal/voice-selection-modal.component';
import { AudioCoordinatorService } from 'src/app/modules/services/audio-coordinator.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {

  // ========================================
  // 🔹 State Management
  // ========================================
  private destroy$ = new Subject<void>();
  private voiceService = inject(VoiceService);
  private toastService = inject(ToastrsService);
  private authSession = inject(LandingAuthSessionService);

  projectId!: number;
  project: ProjectDetails | null = null;
  isLoadingProject$ = new BehaviorSubject<boolean>(true);

  // User auth type from session
  userAuthType: AuthType = AuthType.Customer; // Default to Customer

  // Selected chapter (shared with children)
  selectedChapterId$ = new BehaviorSubject<number | null>(null);

  // Reorder mode for chapters sidebar
  isReorderMode = false;

  // Error handling
  errorMessage = '';

  // Voice Generation state
  voiceProcess$?: Observable<VoiceProcess>;
  voiceState: 'idle' | 'generating' | 'ready' | 'failed' = 'idle';
  canGenerate = false;
  isGenerating = false;
  // NEW: آخر رسالة فشل + مشتق hasFailed
  lastFailureMessage: string | null = null;
  get hasFailed(): boolean { return !!this.lastFailureMessage; }


  // Hierarchical blocking: Track if ANY child is generating
  isAnyChildGenerating = false;

  // Project Audio Player state
  isProjectPlaying = false;
  projectCurrentTime = 0;
  projectDuration = 0;
  projectAudioProgress = 0;
  private audioCoordinator = inject(AudioCoordinatorService);

  isExporting = false;

  // Enums for template
  readonly VoiceStatus = VoiceStatus;
  readonly AuthType = AuthType; // Export enum for template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpService: HttpService,
    private apiPortal: ApiPortalService,
    private modalService: NgbModal,
    private audioPlayer: AudioPlayerService,
    private http: HttpClient,
  ) {
  }

  ngOnInit(): void {
    // Get user auth type from session
    this.userAuthType = this.authSession.userRole ?? AuthType.Customer;

    // Get project ID from route
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.projectId = +params['id'];
        if (this.projectId) {
          this.loadProjectDetails();
        }
      });

    // 🔔 اشترك في حدث إيقاف الصوت من AudioCoordinator
    this.audioCoordinator.onAudioPaused$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pausedAudio => {
        const myAudio = document.querySelector('.project-voice-player-bar audio') as HTMLAudioElement;
        if (myAudio && myAudio === pausedAudio) {
          // الصوت تبعي توقف من برّا
          this.isProjectPlaying = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  exportProjectVoice(type: 'project' | 'chapters'): void {
    if (!this.project) return;

    this.isExporting = true;

    const url = this.apiPortal.voices.export;
    const body = { project_id: this.projectId, type }; // type: 'project' | 'chapters'

    this.http.post(url, body, { observe: 'response', responseType: 'blob' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const contentType = res.headers.get('content-type') || '';

          // السيرفر ممكن يرجّع JSON (فشل) بدل ملف
          if (contentType.includes('application/json')) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const json = JSON.parse(String(reader.result || '{}'));
                this.toastService.showError(json?.msg || 'Project is not ready for export.');
              } catch {
                this.toastService.showError('Project is not ready for export.');
              }
              this.isExporting = false;
            };
            reader.readAsText(res.body as Blob);
            return;
          }

          // نجاح: نزّل الملف
          const blob = res.body as Blob;
          const fileName = type === 'project'
            ? `project-${this.projectId}-voice.zip`
            : `project-${this.projectId}-chapters-voices.zip`;

          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);

          this.toastService.showSuccess('Export ready. Download started.');
          this.isExporting = false;
        },
        error: (err) => {
          // ممكن يرجّع JSON فيه msg
          const msg = err?.error?.msg || err?.message || 'Export failed';
          this.toastService.showError(msg);
          this.isExporting = false;
        }
      });
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.isExporting) {
      event.preventDefault();
      event.returnValue = 'Export in progress. Are you sure you want to leave?';
    }
  }

  // ========================================
  // 🔸 Load Project Details
  // ========================================
  loadProjectDetails(): void {
    this.isLoadingProject$.next(true);
    this.errorMessage = '';

    const url = this.apiPortal.projects.details(this.projectId.toString());

    this.httpService.listGet(url, 'loadProjectDetails').subscribe({
      next: (response: ProjectDetailsResponse) => {
        if (response.success && response.data) {
          this.project = response.data;
          this.canGenerate = true;

          // ✅ تأكد أنو نختار أول شابتر أو آخر واحد محفوظ محليًا
          const chapters = this.project.chapters ?? [];

          if (chapters.length > 0) {
            const lastChapterId = this.getLastOpenedChapter();
            const chapterToSelect =
              lastChapterId && chapters.some(c => c.id === lastChapterId)
                ? lastChapterId
                : chapters[0].id;

            this.selectChapter(chapterToSelect);
          } else {
            this.selectedChapterId$.next(null);
          }

          // ✅ ضبط حالات الصوت (زي ما عندك بالأصل)
          if (this.project.process) {
            if (this.project.process.status === VoiceStatus.Failed) {
              this.handleProcessFailure(this.project.process?.error_message || 'Generation failed');
            } else {
              this.voiceState = getVoiceUIState(this.project);
              if ([VoiceStatus.Pending, VoiceStatus.Processing].includes(this.project.process.status)) {
                this.resumeVoiceTracking(this.project.process.id);
              }
            }
          } else {
            this.voiceState = 'idle';
          }
        }

        this.isLoadingProject$.next(false);
      },
      error: (error) => {
        console.error('Failed to load project:', error);
        this.errorMessage = 'Failed to load project details';
        this.isLoadingProject$.next(false);
      }
    });
  }


  seekProjectAudio(event: MouseEvent): void {
    const audio = document.querySelector('.project-voice-player-bar audio') as HTMLAudioElement;
    const track = event.currentTarget as HTMLElement;

    if (!audio || !this.projectDuration) return;

    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.min(Math.max(clickX / rect.width, 0), 1);

    const newTime = percentage * this.projectDuration;
    audio.currentTime = newTime;

    this.projectCurrentTime = newTime;
    this.projectAudioProgress = percentage * 100;
  }

  // ========================================
  // 🔸 Check if ANY Child Entity is Generating
  // ========================================
  updateCanGenerate(): void {
    if (!this.project) {
      this.canGenerate = false;
      return;
    }

    // Check if any child (Chapter or Paragraph) is generating
    this.isAnyChildGenerating = this.voiceService.hasActiveProcessInProject(this.projectId);

    // Can generate if:
    // 1. User has permission (already set to true)
    // 2. Project is not currently generating
    // 3. No child entity is generating
    this.canGenerate = !this.isGenerating && !this.isAnyChildGenerating;
  }

  // ========================================
  // 🔸 Chapter Selection
  // ========================================
  selectChapter(chapterId: number): void {
    this.selectedChapterId$.next(chapterId);
    this.saveLastOpenedChapter(chapterId);
  }

  // ========================================
  // 🔸 Chapter Added Handler
  // ========================================
  onChapterAdded(chapter: ChapterRef): void {
    if (this.project) {
      // Add to top of list
      this.project.chapters.unshift(chapter);
      // Auto-select the new chapter
      this.selectChapter(chapter.id);
    }
  }

  // ========================================
  // 🔸 Reload Chapters After Add/Delete
  // ========================================
  onReloadRequested(): void {
    // Reload project details to get fresh chapters list
    const url = this.apiPortal.projects.details(this.projectId.toString());
    const oldSelectedId = this.selectedChapterId$.value;

    this.httpService.listGet(url, 'reloadAfterChange').subscribe({
      next: (response: ProjectDetailsResponse) => {
        if (response.success && response.data) {
          this.project = response.data;

          if (this.project.chapters.length > 0) {
            // Check if old selected chapter still exists
            const stillExists = this.project.chapters.find(c => c.id === oldSelectedId);

            if (stillExists) {
              // Keep same selection
              this.selectChapter(oldSelectedId!);
            } else {
              // Old chapter was deleted, select first chapter
              this.selectChapter(this.project.chapters[0].id);
            }
          } else {
            // No chapters left
            this.selectedChapterId$.next(null);
          }
        }
      },
      error: (error) => {
        console.error('Failed to reload chapters:', error);
      }
    });
  }

  // ========================================
  // 🔸 Chapter Renamed Handler
  // ========================================
  onChapterRenamed(data: { chapterId: number; newTitle: string }): void {
    if (this.project) {
      const chapter = this.project.chapters.find(c => c.id === data.chapterId);
      if (chapter) {
        chapter.title = data.newTitle;
      }
    }
  }

  // ========================================
  // 🔸 Chapter Deleted Handler (From Workspace)
  // ========================================
  onChapterDeletedFromWorkspace(chapterId: number): void {
    // Open delete modal
    const modalRef = this.modalService.open(DeleteComponent, {
      centered: true,
      backdrop: 'static'
    });

    const chapter = this.project?.chapters.find(c => c.id === chapterId);

    modalRef.componentInstance.id = chapterId;
    modalRef.componentInstance.type = 'chapter';
    modalRef.componentInstance.message = `Are you sure you want to delete chapter "${chapter?.title || 'this chapter'}"?`;

    modalRef.closed.subscribe((result) => {
      if (result === 'deleted') {
        this.onChapterDeleted(chapterId);
      }
    });
  }

  // ========================================
  // 🔸 Chapter Deleted Handler
  // ========================================
  onChapterDeleted(chapterId: number): void {
    if (!this.project) return;

    const index = this.project.chapters.findIndex(c => c.id === chapterId);
    if (index === -1) return;

    // Remove from list
    this.project.chapters.splice(index, 1);

    // If deleted chapter was selected, select nearest
    if (this.selectedChapterId$.value === chapterId) {
      if (this.project.chapters.length > 0) {
        // Select previous or next chapter
        const newIndex = Math.max(0, index - 1);
        this.selectChapter(this.project.chapters[newIndex].id);
      } else {
        this.selectedChapterId$.next(null);
      }
    }
  }

  // ========================================
  // 🔸 Chapters Reordered Handler
  // ========================================
  onChaptersReordered(chapters: ChapterRef[]): void {
    if (this.project) {
      this.project.chapters = chapters;
    }
  }

  // ========================================
  // 🔸 Toggle Reorder Mode
  // ========================================
  toggleReorderMode(): void {
    this.isReorderMode = !this.isReorderMode;
  }

  // ========================================
  // 🔸 LocalStorage: Last Opened Chapter
  // ========================================
  private getLastOpenedChapter(): number | null {
    const key = `proj:${this.projectId}:lastChapter`;
    const stored = localStorage.getItem(key);
    return stored ? +stored : null;
  }

  private saveLastOpenedChapter(chapterId: number): void {
    const key = `proj:${this.projectId}:lastChapter`;
    localStorage.setItem(key, chapterId.toString());
  }

  // ========================================
  // 🔸 Back to Projects List
  // ========================================
  goBack(): void {
    this.router.navigate(['/audio-portal/my-projects']);
  }

  // ========================================
  // 🎙️ Voice Generation
  // ========================================

  /**
   * Generate voice for entire project
   */
  generateVoice(): void {
    this.updateCanGenerate();
    if (!this.canGenerate || this.isGenerating || !this.project) return;

    if (this.isAnyChildGenerating) {
      this.toastService.showWarning('Cannot generate project voice while a chapter or paragraph is generating');
      return;
    }

    // 🧹 أي محاولة جديدة = امسح آخر فشل
    this.lastFailureMessage = null;

    // 🎤 افتح مودال اختيار الصوت ومدد الصمت
    const modalRef = this.modalService.open(VoiceSelectionModalComponent, { centered: true, size: 'lg' });
    modalRef.componentInstance.entityType = 'project';
    modalRef.componentInstance.defaultVoiceKey = this.project?.voice_key;

    modalRef.result.then(
      (result: any) => {
        if (!result) return;

        const voiceKey = result.key;
        const silences = result.silences || {};

        console.log(
          `[ProjectDetails] Selected voice ${voiceKey} with silences:`,
          silences
        );

        this.proceedWithVoiceGeneration(voiceKey, silences);
      },
      () => console.log('[ProjectDetails] Voice selection cancelled')
    );
  }

  /**
   * Proceed with voice generation after voice selection
   */
  private proceedWithVoiceGeneration(
    voiceKey: string,
    silences: { paragraph?: number; chapterTitle?: number; chapter?: number } = {}
  ): void {
    this.isGenerating = true;
    this.voiceState = 'generating';
    this.toastService.showInfo(`Generating project voice... ⏳`);

    this.voiceService
      .generateVoice(VoiceEntityType.Project, this.projectId, voiceKey, silences)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (processId) => {
          if (this.project) {
            this.project.process ??= { id: processId, status: VoiceStatus.Pending };
            this.trackVoiceGeneration(processId);
          }
        },
        error: (error) => {
          this.handleProcessFailure(error?.message || 'Failed to start generation');
          this.toastService.showError('Failed to generate voice. Please try again.');
        }
      });
  }



  /**
   * Track voice generation progress
   */
  private trackVoiceGeneration(processId: number): void {
    this.voiceProcess$ = this.voiceService.trackProcess(
      processId, VoiceEntityType.Project, this.projectId
    ).pipe(
      tap(process => {
        if (this.project) this.project.process = process;

        // NEW: فشل؟ رجّع لـ idle + hint وتوقّف
        if (process.status === VoiceStatus.Failed) {
          this.handleProcessFailure(process?.error_message || 'Generation failed');
          return;
        }

        // تحديث طبيعي للحالات الأخرى
        this.voiceState = getVoiceUIState(this.project);
        this.isGenerating = process.status === VoiceStatus.Pending ||
          process.status === VoiceStatus.Processing;
      }),
      takeUntil(this.destroy$)
    );

    this.voiceProcess$.subscribe({
      next: (finalProcess) => {
        if (finalProcess.status === VoiceStatus.Completed) {
          this.toastService.showSuccess('Project voice generated successfully! 🎉');
          this.loadProjectDetails(); // تحديث شامل
        } else if (finalProcess.status === VoiceStatus.Failed) {
          // (اختياري) توست فقط — الـ UI عولج في tap
          this.toastService.showError(finalProcess.error_message || 'Project voice generation failed');
        }
      },
      error: (error) => {
        // CHANGED: ما نعيّن failed في الـ UI
        this.handleProcessFailure(error?.message || 'Tracking error');
        this.toastService.showError('Error occurred while tracking generation');
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
    this.updateCanGenerate();
    if (!this.canGenerate || !this.project) return;
    if (this.isAnyChildGenerating) {
      this.toastService.showWarning('Cannot generate project voice while a chapter or paragraph is generating');
      return;
    }

    // NEW: نظّف أي عملية سابقة وأعد التوليد
    this.project.process = undefined;
    this.voiceState = 'idle';
    this.isGenerating = false;
    this.lastFailureMessage = null;

    this.generateVoice();
  }

  /**
   * Download voice file
   */
  downloadVoice(): void {
    if (!this.project?.voice_url) return;

    const link = document.createElement('a');
    link.href = this.project.voice_url;
    link.download = `project-${this.projectId}-voice.mp3`;
    link.click();
  }

  /**
   * Play project voice in Audio Dock
   */
  playProjectVoice(): void {
    if (!this.project?.voice_url) return;

    this.audioPlayer.play({
      id: `project-${this.projectId}`,
      title: this.project.name || 'Project Voice',
      url: this.project.voice_url,
      type: 'project',
      coverLetter: this.project.name?.charAt(0).toUpperCase() || 'P'
    });
  }

  /**
   * Get tooltip text for voice button
   */
  getVoiceTooltip(): string {
    this.updateCanGenerate();
    if (this.isAnyChildGenerating) return 'Cannot generate - a chapter or paragraph is currently generating voice';
    if (!this.canGenerate) return 'You need Editor permissions to generate voice';
    if (this.isGenerating) return 'Generating full project voice...';
    if (this.voiceState === 'ready') return 'Click to play project voice';
    if (this.hasFailed) return 'Previous attempt failed — click to regenerate';
    return 'Generate voice for the entire project';
  }

  // NEW
  private handleProcessFailure(message?: string): void {
    this.isGenerating = false;
    this.voiceState = 'idle'; // لا نعرض failed UI أبداً
    this.lastFailureMessage = message || 'Unknown error';

    if (this.project) {
      this.project.process = undefined; // نظّف العملية السابقة
    }

    this.updateCanGenerate();
  }


  // ========================================
  //  Project Audio Player Controls
  // ========================================

  /**
   * Toggle play/pause for project voice
   */
  toggleProjectVoice(): void {
    const audio = document.querySelector('.project-voice-player-bar audio') as HTMLAudioElement;
    if (!audio) return;

    if (this.isProjectPlaying) {
      audio.pause();
      this.isProjectPlaying = false;
    } else {
      // 🔔 سجل الصوت في السيرفس (راح يوقف أي صوت تاني تلقائي)
      this.audioCoordinator.register(audio);
      audio.play();
      this.isProjectPlaying = true;
    }
  }

  /**
   * Handle audio time update
   */
  onProjectTimeUpdate(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    this.projectCurrentTime = audio.currentTime;
    this.projectAudioProgress = (audio.currentTime / audio.duration) * 100 || 0;
  }

  /**
   * Handle metadata loaded
   */
  onProjectMetadataLoaded(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    this.projectDuration = audio.duration;
  }

  /**
   * Handle audio ended
   */
  onProjectAudioEnded(): void {
    this.isProjectPlaying = false;
    this.projectCurrentTime = 0;
    this.projectAudioProgress = 0;
    this.audioCoordinator.stopAll();
  }

  /**
   * Format time in MM:SS
   */
  formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
