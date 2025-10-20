import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';
import { ChapterRef, ApiResponse } from '../models/project-details.model';

@Component({
    selector: 'app-chapters-sidebar',
    templateUrl: './chapters-sidebar.component.html',
    styleUrls: ['./chapters-sidebar.component.css']
})
export class ChaptersSidebarComponent implements OnChanges {

    @Input() projectId!: number;
    @Input() chapters: ChapterRef[] = [];
    @Input() selectedChapterId: number | null = null;
    @Input() isReorderMode = false;
    @Input() isInitialLoading = false; // For initial page load

    @Output() chapterSelected = new EventEmitter<number>();
    @Output() chapterRenamed = new EventEmitter<{ chapterId: number; newTitle: string }>();
    @Output() chaptersReordered = new EventEmitter<ChapterRef[]>();
    @Output() reloadRequested = new EventEmitter<void>();

    // ========================================
    // 🔹 State
    // ========================================
    searchTerm = '';
    filteredChapters: ChapterRef[] = [];

    // Add chapter state
    isAddingChapter = false;
    newChapterTitle = '';

    // Rename chapter state
    renamingChapterId: number | null = null;
    renameTitle = '';

    // Loading states
    isSubmitting = false;
    isReloading = false;

    constructor(
        private httpService: HttpService,
        private apiPortal: ApiPortalService,
        private modalService: NgbModal
    ) { }

    ngOnChanges(): void {
        this.applyFilter();
        // Reset reload state when chapters updated
        if (this.isReloading) {
            this.isReloading = false;
        }
    }

    // ========================================
    // 🔸 Filter Chapters
    // ========================================
    applyFilter(): void {
        const term = this.searchTerm.toLowerCase().trim();
        if (!term) {
            this.filteredChapters = [...this.chapters];
        } else {
            this.filteredChapters = this.chapters.filter(c =>
                c.title.toLowerCase().includes(term)
            );
        }
    }

    onSearchChange(): void {
        this.applyFilter();
    }

    // ========================================
    // 🔸 Select Chapter
    // ========================================
    selectChapter(chapterId: number): void {
        if (!this.isReorderMode) {
            this.chapterSelected.emit(chapterId);
        }
    }

    // ========================================
    // 🔸 Add Chapter
    // ========================================
    startAddingChapter(): void {
        this.isAddingChapter = true;
        this.newChapterTitle = '';
        setTimeout(() => {
            const input = document.querySelector('.add-chapter-input') as HTMLInputElement;
            input?.focus();
        }, 100);
    }

    cancelAddChapter(): void {
        this.isAddingChapter = false;
        this.newChapterTitle = '';
    }

    submitAddChapter(): void {
        const title = this.newChapterTitle.trim();
        if (!title || this.isSubmitting) return;

        this.isSubmitting = true;

        const body = {
            title,
            project_id: this.projectId
        };

        this.httpService.action(this.apiPortal.chapters.create, body, 'addChapter').subscribe({
            next: (response: ApiResponse<ChapterRef>) => {
                if (response.success) {
                    // Reset form
                    this.cancelAddChapter();
                    this.isSubmitting = false;

                    // Request reload with skeleton
                    this.isReloading = true;
                    this.reloadRequested.emit();
                } else {
                    this.isSubmitting = false;
                }
            },
            error: (error) => {
                console.error('Failed to add chapter:', error);
                this.isSubmitting = false;
            }
        });
    }

    // ========================================
    // 🔸 Rename Chapter
    // ========================================
    startRenaming(chapter: ChapterRef, event: Event): void {
        event.stopPropagation();
        this.renamingChapterId = chapter.id;
        this.renameTitle = chapter.title;

        setTimeout(() => {
            const input = document.querySelector('.rename-input') as HTMLInputElement;
            input?.focus();
            input?.select();
        }, 100);
    }

    cancelRename(): void {
        this.renamingChapterId = null;
        this.renameTitle = '';
    }

    submitRename(chapterId: number): void {
        const title = this.renameTitle.trim();
        if (!title || this.isSubmitting) return;

        this.isSubmitting = true;

        const body = {
            title,
            project_id: this.projectId
        };

        const url = this.apiPortal.chapters.edit(chapterId.toString());

        this.httpService.action(url, body, 'editChapter').subscribe({
            next: (response: ApiResponse<any>) => {
                if (response.success) {
                    this.chapterRenamed.emit({ chapterId, newTitle: title });
                    this.cancelRename();
                }
                this.isSubmitting = false;
            },
            error: (error) => {
                console.error('Failed to rename chapter:', error);
                this.isSubmitting = false;
            }
        });
    }

    // ========================================
    // 🔸 Delete Chapter
    // ========================================
    deleteChapter(chapter: ChapterRef, event: Event): void {
        event.stopPropagation();

        const modalRef = this.modalService.open(DeleteComponent, {
            centered: true,
            backdrop: 'static'
        });

        modalRef.componentInstance.id = chapter.id;
        modalRef.componentInstance.type = 'chapter';
        modalRef.componentInstance.message = `Are you sure you want to delete chapter "${chapter.title}"?`;
        modalRef.closed.subscribe((result) => {
            if (result === 'deleted') {
                // Show skeleton and request reload
                this.isReloading = true;
                this.reloadRequested.emit();
            }
        });
    }

    // ========================================
    // 🔸 Drag & Drop Reorder
    // ========================================
    onDrop(event: CdkDragDrop<ChapterRef[]>): void {
        if (!this.isReorderMode) return;

        const reordered = [...this.chapters];
        moveItemInArray(reordered, event.previousIndex, event.currentIndex);

        // Update order property
        reordered.forEach((ch, index) => ch.order = index);

        this.chaptersReordered.emit(reordered);
        this.saveReorderToLocalStorage(reordered);
    }

    saveReorderLocally(): void {
        this.saveReorderToLocalStorage(this.chapters);
    }

    private saveReorderToLocalStorage(chapters: ChapterRef[]): void {
        const key = `proj:${this.projectId}:chaptersOrder`;
        const order = chapters.map(c => c.id);
        localStorage.setItem(key, JSON.stringify(order));
    }

    // ========================================
    // 🔸 TrackBy
    // ========================================
    trackByChapterId(index: number, chapter: ChapterRef): number {
        return chapter.id;
    }
}
