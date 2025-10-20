import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import {
  ProjectDetails,
  ProjectDetailsResponse,
  ChapterDetails,
  ChapterDetailsResponse,
  ParagraphItem,
  ParagraphsResponse,
  NoteItem,
  NotesResponse,
  ApiResponse
} from '../models/project-details.model';
import { 
  GenerateVoiceRequest,
  GenerateVoiceResponse,
  VoiceStatusResponse
} from '../models/voice.model';

/**
 * 🎯 Centralized Service for all Project Details APIs
 * Uses shareReplay(1) for repeated streams to avoid duplicate network hits
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectsClientService {

  // Cache for shared observables
  private chapterDetailsCache = new Map<number, Observable<ChapterDetails | null>>();
  private paragraphsCache = new Map<number, Observable<ParagraphItem[]>>();
  private notesCache = new Map<number, Observable<NoteItem[]>>();

  constructor(
    private httpService: HttpService,
    private apiPortal: ApiPortalService
  ) {}

  // ========================================
  // 📦 Project APIs
  // ========================================

  /**
   * Get project details (name + chapters list)
   * Called from Resolver
   */
  getProjectDetails(projectId: string | number): Observable<ProjectDetails | null> {
    const url = this.apiPortal.projects.details(String(projectId));
    
    return this.httpService.listGet(url, 'getProjectDetails').pipe(
      map((response: ProjectDetailsResponse) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      shareReplay(1)
    );
  }

  // ========================================
  // 📖 Chapter APIs
  // ========================================

  /**
   * Get chapter details with caching
   * Uses shareReplay to avoid duplicate requests
   */
  getChapterDetails(chapterId: number, forceRefresh = false): Observable<ChapterDetails | null> {
    if (forceRefresh || !this.chapterDetailsCache.has(chapterId)) {
      const url = this.apiPortal.chapters.details(String(chapterId));
      
      const observable = this.httpService.listGet(url, 'getChapterDetails').pipe(
        map((response: ChapterDetailsResponse) => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        shareReplay(1)
      );

      this.chapterDetailsCache.set(chapterId, observable);
    }

    return this.chapterDetailsCache.get(chapterId)!;
  }

  /**
   * Add new chapter
   */
  addChapter(projectId: number, title: string): Observable<any> {
    const url = this.apiPortal.chapters.create;
    const body = { project_id: projectId, title };
    
    return this.httpService.list(url, body, 'addChapter').pipe(
      map((response: ApiResponse<any>) => response.data)
    );
  }

  /**
   * Rename chapter
   */
  renameChapter(chapterId: number, newTitle: string): Observable<any> {
    const url = this.apiPortal.chapters.edit(String(chapterId));
    const body = { title: newTitle };
    
    return this.httpService.list(url, body, 'renameChapter').pipe(
      map((response: ApiResponse<any>) => {
        // Clear cache for this chapter
        this.chapterDetailsCache.delete(chapterId);
        return response.data;
      })
    );
  }

  /**
   * Delete chapter
   */
  deleteChapter(chapterId: number): Observable<any> {
    const url = this.apiPortal.chapters.delete(chapterId);
    
    return this.httpService.list(url, {}, 'deleteChapter').pipe(
      map((response: ApiResponse<any>) => {
        // Clear cache for this chapter
        this.chapterDetailsCache.delete(chapterId);
        this.paragraphsCache.delete(chapterId);
        this.notesCache.delete(chapterId);
        return response.data;
      })
    );
  }

  /**
   * Reorder chapters (future implementation)
   */
  reorderChapters(projectId: number, orderedIds: number[]): Observable<any> {
    // TODO: Implement when backend endpoint is ready
    const url = `${this.apiPortal.chapters.create}`; // Placeholder, needs proper endpoint
    const body = { project_id: projectId, chapter_ids: orderedIds };
    
    return this.httpService.list(url, body, 'reorderChapters').pipe(
      map((response: ApiResponse<any>) => response.data)
    );
  }

  // ========================================
  // 📝 Paragraphs APIs
  // ========================================

  /**
   * Get chapter paragraphs (up to 100 items, no pagination)
   */
  getChapterParagraphs(chapterId: number, forceRefresh = false): Observable<ParagraphItem[]> {
    if (forceRefresh || !this.paragraphsCache.has(chapterId)) {
      const url = `${this.apiPortal.chapters.paragraphs(String(chapterId))}?size=100&page=1`;
      
      const observable = this.httpService.listGet(url, 'getChapterParagraphs').pipe(
        map((response: ParagraphsResponse) => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        shareReplay(1)
      );

      this.paragraphsCache.set(chapterId, observable);
    }

    return this.paragraphsCache.get(chapterId)!;
  }

  /**
   * Add new paragraph
   */
  addParagraph(chapterId: number, text: string, isTitle: boolean = false): Observable<ParagraphItem> {
    const url = this.apiPortal.paragraphs.create;
    const body = { 
      chapter_id: chapterId, 
      text, 
      is_title: isTitle 
    };
    
    return this.httpService.list(url, body, 'addParagraph').pipe(
      map((response: ApiResponse<ParagraphItem>) => {
        // Clear cache to force refresh
        this.paragraphsCache.delete(chapterId);
        return response.data;
      })
    );
  }

  /**
   * Edit paragraph
   */
  editParagraph(paragraphId: number, text: string, isTitle?: boolean): Observable<ParagraphItem> {
    const url = this.apiPortal.paragraphs.edit(String(paragraphId));
    const body: any = { text };
    if (isTitle !== undefined) {
      body.is_title = isTitle;
    }
    
    return this.httpService.list(url, body, 'editParagraph').pipe(
      map((response: ApiResponse<ParagraphItem>) => response.data)
    );
  }

  /**
   * Delete paragraph
   */
  deleteParagraph(paragraphId: number, chapterId: number): Observable<any> {
    const url = this.apiPortal.paragraphs.delete(paragraphId);
    
    return this.httpService.list(url, {}, 'deleteParagraph').pipe(
      map((response: ApiResponse<any>) => {
        // Clear cache to force refresh
        this.paragraphsCache.delete(chapterId);
        return response.data;
      })
    );
  }

  // ========================================
  // 📌 Notes APIs
  // ========================================

  /**
   * Get chapter notes (up to 50 items)
   */
  getChapterNotes(chapterId: number, forceRefresh = false): Observable<NoteItem[]> {
    if (forceRefresh || !this.notesCache.has(chapterId)) {
      const url = `${this.apiPortal.chapters.notes(String(chapterId))}?size=50&page=1`;
      
      const observable = this.httpService.listGet(url, 'getChapterNotes').pipe(
        map((response: NotesResponse) => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        shareReplay(1)
      );

      this.notesCache.set(chapterId, observable);
    }

    return this.notesCache.get(chapterId)!;
  }

  /**
   * Add new note
   */
  addNote(chapterId: number, text: string): Observable<NoteItem> {
    const url = this.apiPortal.notes.create;
    const body = { 
      chapter_id: chapterId, 
      text 
    };
    
    return this.httpService.list(url, body, 'addNote').pipe(
      map((response: ApiResponse<NoteItem>) => {
        // Clear cache to force refresh
        this.notesCache.delete(chapterId);
        return response.data;
      })
    );
  }

  /**
   * Edit note
   */
  editNote(noteId: number, text: string): Observable<NoteItem | null> {
    const url = this.apiPortal.notes.edit(String(noteId));
    const body = { text };
    
    return this.httpService.list(url, body, 'editNote').pipe(
      map((response: ApiResponse<NoteItem | null>) => response.data)
    );
  }

  /**
   * Delete note
   */
  deleteNote(noteId: number, chapterId: number): Observable<any> {
    const url = this.apiPortal.notes.delete(noteId);
    
    return this.httpService.list(url, {}, 'deleteNote').pipe(
      map((response: ApiResponse<any>) => {
        // Clear cache to force refresh
        this.notesCache.delete(chapterId);
        return response.data;
      })
    );
  }

  // ========================================
  // 🎙️ Voice Generation APIs
  // ========================================

  /**
   * Generate voice for entity (Project/Chapter/Paragraph)
   * Returns process_id for polling
   */
  generateVoice(request: GenerateVoiceRequest): Observable<number> {
    const url = this.apiPortal.voices.generate;
    
    return this.httpService.list(url, request, 'generateVoice').pipe(
      map((response: GenerateVoiceResponse) => {
        if (response.success && response.data?.process_id) {
          return response.data.process_id;
        }
        throw new Error('Failed to generate voice: No process ID returned');
      })
    );
  }

  /**
   * Get voice generation status
   * Polls for status updates
   */
  getVoiceStatus(processId: number): Observable<VoiceStatusResponse> {
    const url = this.apiPortal.voices.status(String(processId));
    
    return this.httpService.listGet(url, 'getVoiceStatus').pipe(
      map((response: VoiceStatusResponse) => response)
    );
  }

  // ========================================
  // 🧹 Cache Management
  // ========================================

  /**
   * Clear all caches (call when leaving project details page)
   */
  clearAllCaches(): void {
    this.chapterDetailsCache.clear();
    this.paragraphsCache.clear();
    this.notesCache.clear();
  }

  /**
   * Clear cache for specific chapter
   */
  clearChapterCache(chapterId: number): void {
    this.chapterDetailsCache.delete(chapterId);
    this.paragraphsCache.delete(chapterId);
    this.notesCache.delete(chapterId);
  }
}
