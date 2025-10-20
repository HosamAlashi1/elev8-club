import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ProjectsClientService } from '../../../services/projects-client.service';
import { ParagraphItem } from '../../../models/project-details.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';

interface TocItem {
  id: number;
  text: string;
  element: HTMLElement | null;
}

@Component({
  selector: 'app-paragraphs-tab',
  templateUrl: './paragraphs-tab.component.html',
  styleUrls: ['./paragraphs-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParagraphsTabComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  
  @Input() chapterId!: number;
  @Input() authType?: number; // User's auth type (3 = Editor)
  @Input() isProjectGenerating = false; // 🔒 Parent blocking: Project is generating
  @Input() isChapterGenerating = false; // 🔒 Parent blocking: Chapter is generating

  // ========================================
  // 🔹 State
  // ========================================
  paragraphs: ParagraphItem[] = [];
  filteredParagraphs: ParagraphItem[] = [];
  isLoading = true;
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

  private destroy$ = new Subject<void>();

  constructor(
    private projectsClient: ProjectsClientService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {}

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
    // Setup IntersectionObserver for ScrollSpy
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
        element: null // Will be populated by ScrollSpy
      }));
  }

  scrollToSection(paragraphId: number): void {
    const element = document.getElementById(`paragraph-${paragraphId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Highlight animation
      element.classList.add('highlight-flash');
      setTimeout(() => {
        element.classList.remove('highlight-flash');
      }, 1500);
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
          const id = parseInt(entry.target.getAttribute('data-paragraph-id') || '0');
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
          if (element) {
            this.intersectionObserver!.observe(element);
          }
        });
    }, 100);
  }

  // ========================================
  // 🔸 Add Paragraph
  // ========================================
  toggleComposer(): void {
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
          // Optimistic UI: Add locally then refresh
          this.toggleComposer();
          this.loadParagraphs(); // Refresh list
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
  // 🔸 Edit Paragraph (from child)
  // ========================================
  onParagraphEdited(paragraph: ParagraphItem): void {
    const index = this.paragraphs.findIndex(p => p.id === paragraph.id);
    if (index !== -1) {
      this.paragraphs[index] = { ...paragraph };
      this.applyFilter(this.searchQuery); // Re-filter
    }
  }

  // ========================================
  // 🔸 Delete Paragraph (from child)
  // ========================================
  onParagraphDeleted(paragraphId: number): void {
    this.paragraphs = this.paragraphs.filter(p => p.id !== paragraphId);
    this.applyFilter(this.searchQuery); // Re-filter and rebuild TOC
  }

  // ========================================
  // 🔸 Track By
  // ========================================
  trackByParagraphId(index: number, item: ParagraphItem): number {
    return item.id;
  }
}
