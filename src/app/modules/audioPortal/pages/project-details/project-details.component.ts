import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  
  // Hierarchical blocking: Track if ANY child is generating
  isAnyChildGenerating = false;

  // Enums for template
  readonly VoiceStatus = VoiceStatus;
  readonly AuthType = AuthType; // Export enum for template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpService: HttpService,
    private apiPortal: ApiPortalService,
    private modalService: NgbModal,
    private audioPlayer: AudioPlayerService
  ) {}

  ngOnInit(): void {
    // Get user auth type from session
    this.userAuthType = this.authSession.userRole ?? AuthType.Customer;
    console.log('[ProjectDetails] User Auth Type:', this.userAuthType, 'Editor Type:', AuthType.Editor);
    
    // Get project ID from route
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.projectId = +params['id'];
        if (this.projectId) {
          this.loadProjectDetails();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          
          // Check permissions
          this.canGenerate = true;
          
          // Initialize voice state
          if (this.project.process) {
            this.voiceState = getVoiceUIState(this.project);
            
            // Auto-resume polling if active
            if (this.project.process.status === VoiceStatus.Pending || 
                this.project.process.status === VoiceStatus.Processing) {
              this.resumeVoiceTracking(this.project.process.id);
            }
          }
          
          // Auto-select first chapter or last opened chapter
          if (this.project.chapters.length > 0) {
            const lastChapterId = this.getLastOpenedChapter();
            const chapterToSelect = lastChapterId 
              ? this.project.chapters.find(c => c.id === lastChapterId)?.id
              : this.project.chapters[0].id;
            
            if (chapterToSelect) {
              this.selectChapter(chapterToSelect);
            }
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
    // Update canGenerate before checking
    this.updateCanGenerate();
    
    if (!this.canGenerate || this.isGenerating || !this.project) {
      return;
    }

    // Double-check for child generation
    if (this.isAnyChildGenerating) {
      this.toastService.showWarning('Cannot generate project voice while a chapter or paragraph is generating');
      return;
    }

    this.isGenerating = true;
    this.voiceState = 'generating';
    this.toastService.showInfo('Generating project voice... ⏳');

    // Start generation
    this.voiceService.generateVoice(VoiceEntityType.Project, this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (processId) => {
          // Initialize process in project
          if (this.project) {
            if (!this.project.process) {
              this.project.process = {
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
        }
      });
  }

  /**
   * Track voice generation progress
   */
  private trackVoiceGeneration(processId: number): void {
    this.voiceProcess$ = this.voiceService.trackProcess(
      processId,
      VoiceEntityType.Project,
      this.projectId
    ).pipe(
      tap(process => {
        // Update project process
        if (this.project) {
          this.project.process = process;
        }
        
        // Update UI state
        this.voiceState = getVoiceUIState(this.project);
        this.isGenerating = process.status === VoiceStatus.Pending || 
                           process.status === VoiceStatus.Processing;
      }),
      takeUntil(this.destroy$)
    );

    // Subscribe to trigger polling
    this.voiceProcess$.subscribe({
      next: (finalProcess) => {
        if (finalProcess.status === VoiceStatus.Completed) {
          this.toastService.showSuccess('Project voice generated successfully! 🎉');
        } else if (finalProcess.status === VoiceStatus.Failed) {
          this.toastService.showError('Project voice generation failed');
        }
      },
      error: (error) => {
        this.toastService.showError('Error occurred while tracking generation');
        this.voiceState = 'failed';
        this.isGenerating = false;
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
    if (!this.canGenerate || !this.project) return;

    // Clear existing process
    if (this.project) {
      this.project.process = undefined;
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
    // Update status first
    this.updateCanGenerate();
    
    if (this.isAnyChildGenerating) {
      return 'Cannot generate - a chapter or paragraph is currently generating voice';
    }
    if (!this.canGenerate) {
      return 'You need Editor permissions to generate voice';
    }
    if (this.isGenerating) {
      return 'Generating full project voice...';
    }
    if (this.voiceState === 'ready') {
      return 'Click to play project voice';
    }
    return 'Generate voice for the entire project';
  }
}
