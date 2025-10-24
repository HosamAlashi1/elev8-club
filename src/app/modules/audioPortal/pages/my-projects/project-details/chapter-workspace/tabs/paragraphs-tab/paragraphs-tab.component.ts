import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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
  }

  // ========================================
  // 🔸 Load Paragraphs
  // ========================================
  loadParagraphs(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // مهم: عند إعادة التحميل، أخرج من وضع الري أوردر وأصفّر الباك أب
    this.isReorderMode = false;
    this.isSavingOrder = false;
    this.originalOrderIds = [];

    this.projectsClient.getChapterParagraphs(this.chapterId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paragraphs) => {
          this.paragraphs = paragraphs.map(p => ({ ...p, isExpanded: false, isEditing: false }));
          this.filteredParagraphs = [...this.paragraphs];
          this.buildTOC();
          this.isLoading = false;
          this.cdr.markForCheck();

          // Re-setup observer after DOM update
          setTimeout(() => this.setupScrollSpy(), 100);
        },
        error: (error) => {
          console.error('Failed to load paragraphs:', error);
          this.isLoading = false;
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
    if (!query.trim()) {
      this.filteredParagraphs = [...this.paragraphs];
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredParagraphs = this.paragraphs.filter(p =>
        p.text.toLowerCase().includes(lowerQuery)
      );
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
    const isVoiceCompleted = paragraph.process?.status === 3; // VoiceStatus.Completed
    if (isVoiceCompleted) {
      this.loadParagraphs();
    } else {
      const index = this.paragraphs.findIndex(p => p.id === paragraph.id);
      if (index !== -1) {
        this.paragraphs[index] = { ...paragraph };
        this.applyFilter(this.searchQuery);
      }
    }
  }

  onParagraphDeleted(paragraphId: number): void {
    this.paragraphs = this.paragraphs.filter(p => p.id !== paragraphId);
    this.applyFilter(this.searchQuery);
  }

  // ========================================
  // 🔸 TrackBy
  // ========================================
  trackByParagraphId(index: number, item: ParagraphItem): number {
    return item.id;
  }
}
