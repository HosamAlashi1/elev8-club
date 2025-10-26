import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';
import { ChapterRef, ApiResponse } from '../models/project-details.model';
import { ProjectsClientService } from '../services/projects-client.service';
import { Subject, takeUntil } from 'rxjs';
import { ChapterSyncService } from 'src/app/modules/services/chapter-sync.service';
import {
    trigger,
    transition,
    style,
    animate,
} from '@angular/animations';


@Component({
    selector: 'app-chapters-sidebar',
    templateUrl: './chapters-sidebar.component.html',
    styleUrls: ['./chapters-sidebar.component.css'],
    animations: [
        // دخول لطيف من الأعلى (لأزرار reorder)
        trigger('slideFade', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
        ]),

        // Pop-in عند إضافة شابتر جديد
        trigger('popIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95)' }),
                animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
            ]),
        ]),
    ],
})

export class ChaptersSidebarComponent implements OnChanges {

    @Input() projectId!: number;
    @Input() chapters: ChapterRef[] = [];
    @Input() selectedChapterId: number | null = null;
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

    // Reorder mode state
    isReorderMode = false;
    isSavingOrder = false;
    originalChaptersOrder: ChapterRef[] = []; // Backup for cancel
    private originalOrderIds: number[] = [];

    // Loading states
    isSubmitting = false;
    isReloading = false;

    private destroy$ = new Subject<void>();

    constructor(
        private httpService: HttpService,
        private apiPortal: ApiPortalService,
        private modalService: NgbModal,
        private projectsClient: ProjectsClientService,
        private chapterSync: ChapterSyncService
    ) { }

    ngOnInit(): void {
        this.chapterSync.titleChanged$
            .pipe(takeUntil(this.destroy$))
            .subscribe(evt => {
                if (evt.origin === 'paragraph') {
                    this.chapters = this.chapters.map(c =>
                        c.id === evt.chapterId ? { ...c, title: evt.newTitle } : c
                    );
                    this.applyFilter(); // لتحديث filteredChapters
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next(); this.destroy$.complete();
    }


    ngOnChanges(changes: SimpleChanges): void {
        this.applyFilter();

        if (this.isReloading) {
            this.isReloading = false;
        }

        // ✅ كلما تغيّر chapters من الأب (استجابة جديدة من السيرفر)
        if (changes['chapters'] && this.chapters && this.chapters.length > 0) {
            this.selectFirstFromResponse(); // دايمًا اختَر أول شابتر جاي من الـ API
        }
        
    }

    /** يحدد أول شابتر حسب ترتيب الاستجابة */
    private selectFirstFromResponse(): void {
        const firstChapterId = this.chapters[0].id;

        // لو أصلاً محدد ومساوي للأول، ما في داعي نبعث حدث
        const changed = this.selectedChapterId !== firstChapterId;

        this.selectedChapterId = firstChapterId;
        

        if (changed) {
            this.chapterSelected.emit(firstChapterId);
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

        const body = { title, project_id: this.projectId };
        const url = this.apiPortal.chapters.edit(chapterId.toString());

        this.httpService.action(url, body, 'editChapter').subscribe({
            next: (response: ApiResponse<any>) => {
                if (response.success) {
                    // 1) عدّل محليًا
                    this.chapters = this.chapters.map(c =>
                        c.id === chapterId ? { ...c, title } : c
                    );
                    this.applyFilter();

                    // 2) طلّع حدث للجهة الأخرى (الفقرة العنوانية)
                    this.chapterSync.emitTitleChanged({
                        chapterId,
                        newTitle: title,
                        origin: 'sidebar'
                    });

                    // 3) لو بدك تُبقي إخطار الأب موجودًا (اختياري)
                    this.chapterRenamed.emit({ chapterId, newTitle: title });

                    this.cancelRename();
                }
                this.isSubmitting = false;
            },
            error: () => this.isSubmitting = false
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
    // 🔸 Reorder Mode
    // ========================================
    // ----------------- reorder mode -----------------
    toggleReorderMode(): void {
        this.isReorderMode = true;
        this.originalOrderIds = this.chapters.map(c => c.id); // backup
    }

    cancelReorderMode(): void {
        this.isReorderMode = false;
        if (this.originalOrderIds.length) {
            // استرجاع الترتيب الأصلي
            const idToChapter = new Map(this.chapters.map(c => [c.id, c]));
            this.chapters = this.originalOrderIds.map(id => idToChapter.get(id)!).filter(Boolean);
            this.applyFilter();
            this.chaptersReordered.emit(this.chapters);
        }
        this.originalOrderIds = [];
    }

    get isOrderDirty(): boolean {
        const current = this.chapters.map(c => c.id).join(',');
        const original = this.originalOrderIds.join(',');
        return current !== original;
    }

    saveOrder(): void {
        if (this.isSavingOrder || !this.isOrderDirty) return;
        this.isSavingOrder = true;

        const orderedIds = this.chapters.map(c => c.id);

        this.projectsClient.reorderChapters(this.projectId, orderedIds).subscribe({
            next: (res) => {
                // نجاح: نغلق وضع الترتيب ونثبت الترتيب الجديد محليًا
                this.isSavingOrder = false;
                this.isReorderMode = false;
                this.originalOrderIds = [];
                this.saveReorderToLocalStorage(this.chapters);
                this.chaptersReordered.emit(this.chapters); // علّم الأب
            },
            error: (err) => {
                console.error('Failed to save chapter order:', err);
                this.isSavingOrder = false;
                // رجّع الترتيب الأصلي
                this.cancelReorderMode();
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
        this.chapters = reordered;           // 👈 حدّث المصدر
        this.applyFilter();                  // لتنعكس على القائمة العادية
        this.chaptersReordered.emit(this.chapters); // (اختياري) لو الأب يعرض ترتيب حيّ
    }

    private saveReorderToLocalStorage(chapters: ChapterRef[]): void {
        const key = `proj:${this.projectId}:chaptersOrder`;
        const order = chapters.map(c => c.id);
        localStorage.setItem(key, JSON.stringify(order));
    }

    trackByChapterId(index: number, chapter: ChapterRef): number {
        return chapter.id;
    }
}
