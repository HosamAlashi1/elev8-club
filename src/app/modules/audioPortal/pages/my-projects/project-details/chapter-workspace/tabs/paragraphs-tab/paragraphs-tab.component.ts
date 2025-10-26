import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ProjectsClientService } from '../../../services/projects-client.service';
import { ParagraphItem } from '../../../models/project-details.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { animate, style, transition, trigger } from '@angular/animations';

interface TocItem {
  id: number;
  text: string;
  element: HTMLElement | null;
}

@Component({
  selector: 'app-paragraphs-tab',
  templateUrl: './paragraphs-tab.component.html',
  styleUrls: ['./paragraphs-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),

    ]),
  ],
})
export class ParagraphsTabComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {

  @Input() chapterId!: number;
  @Input() authType?: number;                  // 3 = Editor
  @Input() isProjectGenerating = false;
  @Input() isChapterGenerating = false;

  // ========================================
  // 🔹 State
  // ========================================
  paragraphs: ParagraphItem[] = [];
  filteredParagraphs: ParagraphItem[] = [];
  @ViewChild('infiniteAnchor') infiniteAnchor!: ElementRef<HTMLDivElement>;
  @ViewChild('listContainer') listContainer!: ElementRef<HTMLElement>;

  pageSize = 20;
  page = 1;
  hasMore = true;
  loadingMore = false;

  // نخزن ما تم تحميله حتى الآن
  private loadedParagraphs: ParagraphItem[] = [];

  // تبقى واجهتك تستخدم filteredParagraphs للعرض

  private infiniteObserver?: IntersectionObserver;
  isLoading = true;

  // Search
  searchQuery = '';
  private searchSubject = new Subject<string>();

  // Quick TOC
  tocItems: TocItem[] = [];
  activeTocId: number | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  // Add Paragraph Composer
  showComposer = false;
  newParagraphText = '';
  newParagraphIsTitle = false;
  isSubmittingNew = false;

  // Reorder state
  isReorderMode = false;
  isSavingOrder = false;
  private originalOrderIds: number[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private projectsClient: ProjectsClientService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  // ========================================
  // 🔸 Lifecycle
  // ========================================
  ngOnInit(): void {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.applyFilter(query);
    });
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] && this.chapterId) {
      this.loadParagraphs();
    }
  }

  ngAfterViewInit(): void {
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
    this.infiniteObserver?.disconnect();
  }

  // ========================================
  // 🔸 Load Paragraphs
  // ========================================
  loadParagraphs(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.isReorderMode = false;
    this.isSavingOrder = false;
    this.originalOrderIds = [];

    this.page = 1;
    this.hasMore = true;
    this.loadedParagraphs = [];
    this.filteredParagraphs = [];

    // (اختياري) نظّف كاش الفصل
    // this.projectsClient.clearChapterParagraphsCache(this.chapterId);

    this.projectsClient.getChapterParagraphs(this.chapterId, this.page, this.pageSize, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.loadedParagraphs = rows.map(p => ({ ...p, isExpanded: false, isEditing: false }));
          this.applyFilter(this.searchQuery); // تبني filteredParagraphs من المحمّل
          this.buildTOC();
          this.isLoading = false;

          // لو الدفعة أقل من 20 → ما في صفحات لاحقة
          this.hasMore = rows.length === this.pageSize;

          this.cdr.markForCheck();

          // فعّل مراقب الانفينتي سكروول بعد تحديث DOM
          setTimeout(() => this.setupInfiniteScroll(), 100);
          setTimeout(() => this.setupScrollSpy(), 150); // الموجود عندك للـ TOC
        },
        error: (err) => {
          console.error('Failed to load paragraphs:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupInfiniteScroll(): void {
    this.infiniteObserver?.disconnect();

    const root = this.listContainer?.nativeElement || document.querySelector('.paragraphs-list-container');
    if (!root || !this.infiniteAnchor) return;

    this.infiniteObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && this.hasMore && !this.loadingMore && !this.isReorderMode) {
        this.loadMore();
      }
    }, {
      root: root,
      rootMargin: '300px 0px',  // نحمّل قبل الوصول للقاع بقليل
      threshold: 0.01
    });

    this.infiniteObserver.observe(this.infiniteAnchor.nativeElement);
  }

  private loadMore(): void {
    if (!this.hasMore || this.loadingMore) return;

    this.loadingMore = true;
    const nextPage = this.page + 1;

    this.projectsClient.getChapterParagraphs(this.chapterId, nextPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.loadedParagraphs = [...this.loadedParagraphs, ...rows];
          this.applyFilter(this.searchQuery);     // تحدّث العرض والـ TOC
          this.buildTOC();

          this.page = nextPage;
          this.hasMore = rows.length === this.pageSize;
          this.loadingMore = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('loadMore error:', err);
          this.loadingMore = false;
          this.cdr.markForCheck();
        }
      });
  }


  // ========================================
  // 🔸 Search & Filter
  // ========================================
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  applyFilter(query: string): void {
    const base = this.loadedParagraphs;
    if (!query.trim()) {
      this.filteredParagraphs = [...base];
    } else {
      const q = query.toLowerCase();
      this.filteredParagraphs = base.filter(p => p.text.toLowerCase().includes(q));
    }
    this.buildTOC();
    this.cdr.markForCheck();
  }

  // ========================================
  // 🔸 Quick TOC
  // ========================================
  buildTOC(): void {
    this.tocItems = this.filteredParagraphs
      .filter(p => p.is_title)
      .map(p => ({
        id: p.id,
        text: p.text,
        element: null // populated by ScrollSpy
      }));
  }

  scrollToSection(paragraphId: number): void {
    const element = document.getElementById(`paragraph-${paragraphId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      element.classList.add('highlight-flash');
      setTimeout(() => element.classList.remove('highlight-flash'), 1500);
    }
  }

  // ========================================
  // 🔸 ScrollSpy with IntersectionObserver
  // ========================================
  setupScrollSpy(): void {
    this.intersectionObserver?.disconnect();

    const options = {
      root: document.querySelector('.paragraphs-list-container'),
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = parseInt(entry.target.getAttribute('data-paragraph-id') || '0', 10);
          if (this.tocItems.some(item => item.id === id)) {
            this.activeTocId = id;
            this.cdr.markForCheck();
          }
        }
      });
    }, options);

    // Observe all title paragraphs
    setTimeout(() => {
      this.filteredParagraphs
        .filter(p => p.is_title)
        .forEach(p => {
          const element = document.getElementById(`paragraph-${p.id}`);
          if (element) this.intersectionObserver!.observe(element);
        });
    }, 100);
  }

  // ========================================
  // 🔸 Add Paragraph
  // ========================================
  toggleComposer(): void {
    // إغلاق الري أوردر لو مفتوح
    if (this.isReorderMode) return;

    this.showComposer = !this.showComposer;
    this.newParagraphText = '';
    this.newParagraphIsTitle = false;
    this.cdr.markForCheck();

    if (this.showComposer) {
      setTimeout(() => {
        const textarea = document.querySelector('.composer-textarea') as HTMLTextAreaElement;
        textarea?.focus();
      }, 100);
    }
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.submitNewParagraph();
    }
  }

  submitNewParagraph(): void {
    if (!this.newParagraphText.trim() || this.isSubmittingNew) return;

    this.isSubmittingNew = true;
    this.cdr.markForCheck();

    this.projectsClient.addParagraph(this.chapterId, this.newParagraphText.trim(), this.newParagraphIsTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toggleComposer();
          this.loadParagraphs();
          this.isSubmittingNew = false;
        },
        error: (error) => {
          console.error('Failed to add paragraph:', error);
          this.isSubmittingNew = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Reorder Mode
  // ========================================
  toggleReorderMode(): void {
    if (this.isLoading || !this.paragraphs.length) return;

    // أغلق الـ composer أثناء الري أوردر
    this.showComposer = false;

    this.isReorderMode = true;
    this.originalOrderIds = this.paragraphs.map(p => p.id);
    this.cdr.markForCheck();
  }

  cancelReorderMode(): void {
    this.isReorderMode = false;

    if (this.originalOrderIds.length) {
      const map = new Map(this.paragraphs.map(p => [p.id, p]));
      this.paragraphs = this.originalOrderIds.map(id => map.get(id)!).filter(Boolean);
      this.applyFilter(this.searchQuery); // يعيد الفلترة/TOC
    }

    this.originalOrderIds = [];
    this.cdr.markForCheck();
  }

  get isOrderDirty(): boolean {
    return this.paragraphs.map(p => p.id).join(',') !== this.originalOrderIds.join(',');
  }

  onDrop(event: CdkDragDrop<ParagraphItem[]>): void {
    if (!this.isReorderMode) return;

    const next = [...this.paragraphs];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.paragraphs = next;

    // مبدئيًا خلّ الفلترة كما هي (نحافظ على filtered في الوضع العادي فقط)
    this.cdr.markForCheck();
  }

  saveOrder(): void {
    if (this.isSavingOrder || !this.isOrderDirty) return;

    this.isSavingOrder = true;
    this.cdr.markForCheck();

    const orderedIds = this.paragraphs.map(p => p.id);

    this.projectsClient.reorderParagraphs(this.chapterId, orderedIds).subscribe({
      next: () => {
        this.isSavingOrder = false;
        this.isReorderMode = false;
        this.originalOrderIds = [];
        // بنعيد الفلترة عشان ترجع القائمة العادية بالترتيب الجديد
        this.applyFilter(this.searchQuery);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to save paragraph order:', err);
        this.isSavingOrder = false;
        // رجّع الترتيب القديم:
        this.cancelReorderMode();
      }
    });
  }

  // ========================================
  // 🔸 Child outputs
  // ========================================
  onParagraphEdited(paragraph: ParagraphItem): void {
    const idx = this.loadedParagraphs.findIndex(p => p.id === paragraph.id);
    if (idx !== -1) this.loadedParagraphs[idx] = { ...paragraph };
    this.applyFilter(this.searchQuery);
  }

  onParagraphDeleted(paragraphId: number): void {
    this.loadedParagraphs = this.loadedParagraphs.filter(p => p.id !== paragraphId);
    this.applyFilter(this.searchQuery);
  }

  // ========================================
  // 🔸 TrackBy
  // ========================================
  trackByParagraphId(index: number, item: ParagraphItem): number {
    return item.id;
  }
}
