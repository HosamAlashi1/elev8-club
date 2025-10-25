import { Component, OnInit, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { HttpClient } from '@angular/common/http';
import { buildPagesAuto, paginateFlow } from './utils/page-factory';
import { MockReaderApiService } from './services/mock-reader-api.service';
import { AudioSfxService } from './services/audio-sfx.service';
import { ReaderStateService } from './services/reader-state.service';
import { BookFlipComponent } from './components/book-flip/book-flip.component';

export interface Page {
  html: string;
  pageNumber: number;
  chapterId?: number;
  chapterTitle?: string;
}

@Component({
  selector: 'app-book-reader',
  templateUrl: './book-reader.component.html',
  styleUrls: ['./book-reader.component.css']
})
export class BookReaderComponent implements OnInit, OnDestroy {
  @ViewChild(BookFlipComponent) flipComp!: BookFlipComponent;

  projectId!: number;
  bookId!: number; // for mock API

  // Book data
  book: any = null;
  chapters: any[] = [];
  flow: any[] = [];

  // Legacy support
  project: any;
  paragraphs: any[] = [];
  selectedChapterId: number | null = null;

  // Reader state
  isLoading = true;
  pages: Page[] = [];
  currentSpreadIndex = 0;
  currentPage = 1;
  totalPages = 1;

  // Settings
  settings: any = {
    fontSize: 16,
    lineHeight: 1.65,
    theme: 'light',
    spreadMode: true,
    audioEnabled: true,
    audioVolume: 0.35
  };

  // UI flags
  showSettings = false;
  showChaptersSidebar = false;
  isFlipping = false; // For animation

  // Touch/Drag support
  private touchStartX = 0;
  private touchStartY = 0;
  private isDragging = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiPortalService,
    private http: HttpClient,
    private mockApi: MockReaderApiService,
    private audioSfx: AudioSfxService,
    private readerState: ReaderStateService
  ) { }

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.bookId = this.projectId; // Use projectId as bookId for mock API

    // Load saved settings
    const savedSettings = this.readerState.getSettings();
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }

    this.loadBookData();
  }

  ngOnDestroy(): void {
    // Save state before leaving
    this.saveState();
  }

  async loadBookData() {
    this.isLoading = true;
    try {
      // Load book metadata
      this.book = await this.mockApi.getBook(this.bookId).toPromise();

      // Initialize audio SFX
      if (this.book.sounds) {
        this.audioSfx.init(
          { flip: this.book.sounds.flip, drag: this.book.sounds.drag },
          this.book.sounds.enabled,
          this.book.sounds.volume
        );
      }

      // Load chapters
      this.chapters = (await this.mockApi.getChapters(this.bookId).toPromise()) || [];

      // Load flow
      this.flow = (await this.mockApi.getFlow(this.bookId).toPromise()) || [];

      // Apply book settings
      if (this.book.settings) {
        this.settings = { ...this.settings, ...this.book.settings };
      }

      // Paginate the flow
      this.pages = paginateFlow(this.flow, this.book, this.chapters);
      this.totalPages = this.pages.length;

      // Restore last position
      const lastPos = this.readerState.getPosition(this.bookId);
      if (lastPos) {
        this.selectedChapterId = lastPos.chapterId;
        setTimeout(() => {
          const pageIndex = lastPos.pageIndex || 0;
          this.currentPage = pageIndex + 1;
          this.currentSpreadIndex = Math.floor(pageIndex / 2);
          if (this.flipComp) {
            this.flipComp.goTo(pageIndex);
          }
        }, 100);
      } else {
        // Start from beginning
        this.currentPage = 1;
        this.currentSpreadIndex = 0;
        if (this.chapters.length > 0) {
          this.selectedChapterId = this.chapters[0].id;
        }
      }

    } catch (error) {
      console.error('Failed to load book:', error);
      // Fallback to legacy API
      await this.loadProjectDetails();
    } finally {
      this.isLoading = false;
    }
  }

  async loadProjectDetails() {
    try {
      const res: any = await this.http.get(this.api.projects.details(String(this.projectId))).toPromise();
      if (res?.success) {
        this.project = res.data;
        this.chapters = res.data.chapters || [];

        const last = this.getLastPosition();
        const initialChapterId = last?.chapterId ?? this.chapters[0]?.id;
        const initialTitle = this.chapters.find(c => c.id === initialChapterId)?.title;
        if (initialChapterId) await this.selectChapter(initialChapterId, initialTitle);
      }
    } catch (e) {
      console.error('Project details error', e);
    } finally {
      this.isLoading = false;
    }
  }

  async selectChapter(chapterId: number, titleFromList?: string) {
    this.selectedChapterId = chapterId;
    this.isLoading = true;
    try {
      const res: any = await this.http.get(this.api.chapters.paragraphs(String(chapterId))).toPromise();
      if (res?.success) {
        this.paragraphs = res.data;
        const title = titleFromList ?? (this.chapters.find(c => c.id === chapterId)?.title ?? 'Chapter');

        // Legacy mode: build pages from paragraphs (returns HTMLElement[])
        const legacyPages = buildPagesAuto(title, this.paragraphs);

        // Convert to new Page[] format
        this.pages = legacyPages.map((el, idx) => ({
          html: el.innerHTML || '',
          pageNumber: idx + 1,
          chapterId: chapterId,
          chapterTitle: title
        }));

        // لو فيه حفظ سابق لنفس الفصل، ارجع له
        const last = this.getLastPosition();
        setTimeout(() => {
          if (last?.chapterId === chapterId && last.pageIndex > 0) {
            this.flipComp?.goTo(last.pageIndex);
          } else {
            this.currentPage = 1;
          }
          this.totalPages = this.flipComp?.getCount() ?? this.totalPages;
        }, 0);
      }
    } catch (e) {
      console.error('Paragraphs error', e);
    } finally {
      this.isLoading = false;
    }
  }

  getChapterTitle(): string {
    return this.chapters.find(c => c.id === this.selectedChapterId)?.title ?? '';
  }

  // ---- Navigation & State Management ----
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.triggerFlipAnimation();
      this.currentPage++;
      this.currentSpreadIndex = Math.floor((this.currentPage - 1) / 2);
      this.audioSfx.play('flip');
      this.saveState();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.triggerFlipAnimation();
      this.currentPage--;
      this.currentSpreadIndex = Math.floor((this.currentPage - 1) / 2);
      this.audioSfx.play('flip');
      this.saveState();
    }
  }

  private triggerFlipAnimation() {
    this.isFlipping = true;
    setTimeout(() => {
      this.isFlipping = false;
    }, 600);
  }

  // ==============================
  // Touch/Drag/Click Interactions
  // ==============================

  onPageTouchStart(event: TouchEvent, side: 'left' | 'right'): void {
    if (this.isFlipping) return;
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.isDragging = true;
  }

  onPageTouchMove(event: TouchEvent): void {
    if (!this.isDragging || this.isFlipping) return;
    event.preventDefault();
  }

  onPageTouchEnd(event: TouchEvent, side: 'left' | 'right'): void {
    if (!this.isDragging || this.isFlipping) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && side === 'left') {
        this.prevPage();
      } else if (deltaX < 0 && side === 'right') {
        this.nextPage();
      }
    }

    this.isDragging = false;
  }

  onPageMouseDown(event: MouseEvent, side: 'left' | 'right'): void {
    if (this.isFlipping) return;
    this.touchStartX = event.clientX;
    this.touchStartY = event.clientY;
    this.isDragging = true;
  }

  onPageMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.isFlipping) return;
  }

  onPageMouseUp(event: MouseEvent, side: 'left' | 'right'): void {
    if (!this.isDragging || this.isFlipping) return;

    const deltaX = event.clientX - this.touchStartX;
    const deltaY = event.clientY - this.touchStartY;

    if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && side === 'left') {
          this.prevPage();
        } else if (deltaX < 0 && side === 'right') {
          this.nextPage();
        }
      }
    }

    this.isDragging = false;
  }

  onPageClick(side: 'left' | 'right'): void {
    if (this.isFlipping) return;

    if (side === 'left') {
      this.prevPage();
    } else {
      this.nextPage();
    }
  }

  onPageMouseLeave(): void {
    this.isDragging = false;
  }

  goToChapter(chapterId: number) {
    // Find first page of chapter
    const pageIndex = this.pages.findIndex(p => p.chapterId === chapterId);
    if (pageIndex >= 0 && this.flipComp) {
      this.flipComp.goTo(pageIndex);
      this.selectedChapterId = chapterId;
      this.showChaptersSidebar = false;
    } else if (this.project) {
      // Legacy mode - load chapter via API
      const chapter = this.chapters.find(c => c.id === chapterId);
      if (chapter) {
        this.selectChapter(chapterId, chapter.title);
      }
    }
  }

  onPageChange(e: { index: number; total: number }) {
    this.currentPage = e.index;
    this.totalPages = e.total;
    this.currentSpreadIndex = Math.floor((e.index - 1) / 2);

    // Update selected chapter based on current page
    const pageChapterId = this.pages[e.index - 1]?.chapterId;
    if (pageChapterId !== undefined) {
      this.selectedChapterId = pageChapterId;
    }

    this.saveState();
  }

  // ---- Settings Management ----
  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  toggleChaptersSidebar() {
    this.showChaptersSidebar = !this.showChaptersSidebar;
  }

  updateFontSize(delta: number) {
    this.settings.fontSize = Math.max(12, Math.min(24, this.settings.fontSize + delta));
    this.readerState.saveSettings({ fontSize: this.settings.fontSize });
    this.repaginate();
  }

  updateLineHeight(value: number) {
    this.settings.lineHeight = value;
    this.readerState.saveSettings({ lineHeight: value });
    this.repaginate();
  }

  updateTheme(theme: 'light' | 'sepia' | 'dark') {
    this.settings.theme = theme;
    this.readerState.saveSettings({ theme });
  }

  toggleAudio() {
    this.settings.audioEnabled = !this.settings.audioEnabled;
    this.audioSfx.setEnabled(this.settings.audioEnabled);
    this.readerState.saveSettings({ soundEnabled: this.settings.audioEnabled });
  }

  updateVolume(volume: number) {
    this.settings.audioVolume = volume;
    this.audioSfx.setVolume(volume);
    this.readerState.saveSettings({ soundVolume: volume });
  }

  private repaginate() {
    if (this.flow.length > 0) {
      // Save current position
      const currentPageNum = this.currentPage;
      const currentChapterId = this.selectedChapterId;

      // Re-paginate with new settings
      this.pages = paginateFlow(this.flow, { ...this.book, ...this.settings }, this.chapters);
      this.totalPages = this.pages.length;

      // Try to restore approximate position
      const targetPageIndex = this.pages.findIndex(
        p => p.chapterId === currentChapterId && p.pageNumber >= currentPageNum
      );

      if (targetPageIndex >= 0 && this.flipComp) {
        setTimeout(() => {
          this.flipComp.goTo(targetPageIndex);
        }, 100);
      }
    }
  }

  // ---- State Persistence ----
  private saveState() {
    if (!this.selectedChapterId) return;

    this.readerState.savePosition(this.bookId, {
      chapterId: this.selectedChapterId,
      pageIndex: this.currentPage - 1,
      timestamp: Date.now()
    });
  }

  private saveLastPosition() {
    // Legacy support
    localStorage.setItem(`reader:${this.projectId}`,
      JSON.stringify({ chapterId: this.selectedChapterId, pageIndex: this.currentPage - 1 })
    );
  }

  private getLastPosition(): { chapterId: number; pageIndex: number } | null {
    try { return JSON.parse(localStorage.getItem(`reader:${this.projectId}`) || 'null'); }
    catch { return null; }
  }

  pageEls: HTMLElement[] = [];

  private makePageElements(pages: Page[]): HTMLElement[] {
    return pages.map(p => {
      const el = document.createElement('div');
      el.className = 'page';                 // PageFlip يتوقع class=page
      el.innerHTML = `
      <div class="page-content">${p.html}</div>
      <div class="page-number">${p.pageNumber}</div>
    `;
      return el;
    });
  }


  // ---- Keyboard Shortcuts ----
  @HostListener('window:keydown', ['$event'])
  handleKeys(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.nextPage();
    if (e.key === 'ArrowLeft') this.prevPage();
    if (e.key === 'Escape' && this.showSettings) this.showSettings = false;
    if (e.key === 'Escape' && this.showChaptersSidebar) this.showChaptersSidebar = false;
  }

  trackById = (_: number, item: any) => item.id;
}
