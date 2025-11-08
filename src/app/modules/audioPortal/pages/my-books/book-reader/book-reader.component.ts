import { Component, OnInit, ViewChild, HostListener, OnDestroy, ViewEncapsulation, NgZone, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { HttpClient } from '@angular/common/http';
import { paginateFlow } from './utils/page-factory';
import { MockReaderApiService } from './services/mock-reader-api.service';
import { AudioSfxService } from './services/audio-sfx.service';
import { ReaderStateService } from './services/reader-state.service';
import { BookFlipComponent } from './components/book-flip/book-flip.component';
import { firstValueFrom } from 'rxjs';
import { ElementRef, Renderer2 } from '@angular/core';
import { computeEdges } from './utils/page-factory';  // <- استيراد الهيلبر
export interface Page {
  html: string;
  pageNumber: number;
  chapterId?: number;
  chapterTitle?: string;
}

const JSON_CONFIG: any = {
  settings: {
    page: { width: 400, height: 650, gutter: 20, padding: 30 },
    typography: { font: 'Georgia, serif', size: 15, lineHeight: 1.6 },
    theme: 'light',
    spread: true,
    rtl: false,
  },
  sounds: {
    drag: 'assets/sfx/page-drag.mp3',
    flip: 'assets/sfx/page-flip.mp3',
    enabled: true,
    volume: 0.35,
  },
};

@Component({
  selector: 'app-book-reader',
  templateUrl: './book-reader.component.html',
  styleUrls: ['./book-reader.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class BookReaderComponent implements OnInit, OnDestroy {
  @ViewChild(BookFlipComponent) flipComp!: BookFlipComponent;
  @ViewChild('frameRef', { static: false }) frameRef!: ElementRef<HTMLElement>;

  lastDir: 'left' | 'right' = 'right';

  private flipStartIndex = 0;
  private flipFailSafe?: number;

  projectId!: number;
  bookId!: number; // for mock API
  pageEls: HTMLElement[] = [];

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

  private isPointerDown = false;
  private dragSide: 'left' | 'right' = 'right';
  private frameRect!: DOMRect;


  // Settings
  // --- 2) داخل الكلاس BookReaderComponent: عدّل الـ settings الافتراضية لتستوعب قيم JSON ---
  settings: any = {
    fontFamily: '',
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    spreadMode: true,
    rtl: false,
    page: { width: 0, height: 0, gutter: 0, padding: 0 },
    audioEnabled: true,
    audioVolume: 0.35,
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
    private readerState: ReaderStateService,
    private renderer: Renderer2,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,

  ) { }

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.bookId = this.projectId;

    // المصدر الواحد
    this.initConfigFromJson();

    // دمج المحفوظ (بدون لمس الصوت)
    const savedSettings = this.readerState.getSettings();
    if (savedSettings) {
      const { soundEnabled, soundVolume, ...rest } = savedSettings;
      this.settings = { ...this.settings, ...rest };
    }

    this.loadBookData();
  }

  ngOnDestroy(): void {
    // Save state before leaving
    this.saveState();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setFrameMetrics();
      this.ensureEdges();
      this.bindFramePointerListeners();
    }, 0);
  }

  private bindFramePointerListeners() {
    const frame = this.getFrameEl();
    if (!frame) return;

    frame.addEventListener('pointerdown', this.onFramePointerDown, { passive: true });
    window.addEventListener('pointermove', this.onFramePointerMove, { passive: false });
    window.addEventListener('pointerup', this.onFramePointerUp, { passive: true });
  }


  private onFramePointerDown = (e: PointerEvent) => {
    const frame = this.getFrameEl();
    const host = frame?.querySelector('app-book-flip') as HTMLElement;
    if (!frame || !host) return;

    this.frameRect = host.getBoundingClientRect();
    const cx = this.frameRect.left + this.frameRect.width / 2;

    this.isPointerDown = true;

    // اجعل الاتجاه حسب جهة الضغط من منتصف الكتاب:
    this.dragSide = (e.clientX >= cx) ? 'right' : 'left';

    // فعّل كلاس flipping + اتجاه
    frame.classList.add('flipping');
    frame.classList.toggle('flip-right', this.dragSide === 'right');
    frame.classList.toggle('flip-left', this.dragSide === 'left');

    // صفر progress بالبداية
    this.setSpineProgress(0);
  };

  private onFramePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    // امنع السحب من التمرير
    e.preventDefault();

    const frame = this.getFrameEl();
    const host = frame?.querySelector('app-book-flip') as HTMLElement;
    if (!frame || !host || !this.frameRect) return;

    const cx = this.frameRect.left + this.frameRect.width / 2;
    const half = this.frameRect.width / 2;

    // مسافة الإصبع من منتصف الكتاب على جهة السحب
    const dx = (this.dragSide === 'right')
      ? Math.max(0, e.clientX - cx)
      : Math.max(0, cx - e.clientX);

    // progress [0..1] حسب كم ابتعد عن منتصف الكتاب (منطقي بصريًا)
    const raw = dx / half;
    const progress = Math.min(1, Math.max(0, raw));

    this.setSpineProgress(progress);
  };

  private onFramePointerUp = (_e: PointerEvent) => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;

    // رجّع الظل طبيعي بلحظة (CSS transition قصيرة)
    this.setSpineProgress(0);

    const frame = this.getFrameEl();
    if (frame) {
      frame.classList.remove('flipping', 'flip-right', 'flip-left');
    }
  };

  private setSpineProgress(progress: number) {
    const frame = this.getFrameEl();
    if (!frame) return;

    // شدّة الظل: تُحسب في CSS من var(--drag-progress)
    frame.style.setProperty('--drag-progress', progress.toFixed(3));

    // مقدار القصّ حول منتصف spine:
    // 0% عند البداية، ويزيد حتى ~22% عند منتصف الكتاب
    const maskCut = (progress * 22).toFixed(2) + '%';
    frame.style.setProperty('--mask-cut', maskCut);
  }

  async loadBookData() {
    this.isLoading = true;
    try {
      // لا نستخدم book.sounds / book.settings إطلاقاً هنا
      // فقط حمّل الفصول والتدفق من الـ mockApi كالمعتاد:
      this.chapters = (await firstValueFrom(this.mockApi.getChapters(this.bookId)) ?? [])
        .map((c: any) => ({ ...c, id: +c.id }));

      this.flow = await firstValueFrom(this.mockApi.getFlow(this.bookId)) ?? [];

      this.book = await firstValueFrom(this.mockApi.getBook(this.bookId));

      this.pages = paginateFlow(this.flow, this.getLayoutConfig(), this.chapters);

      this.totalPages = this.pages.length;
      this.pageEls = this.makePageElements(this.pages);

      this.cdr.detectChanges();
      setTimeout(() => {
        this.setFrameMetrics();
        this.ensureEdges();
      }, 0);

      const lastPos = this.readerState.getPosition(this.bookId);
      if (lastPos) {
        this.selectedChapterId = lastPos.chapterId;
        setTimeout(() => {
          const pageIndex = lastPos.pageIndex || 0;
          this.currentPage = pageIndex + 1;
          this.currentSpreadIndex = Math.floor(pageIndex / 2);
          this.flipComp?.goTo(pageIndex);
        }, 100);
      } else {
        this.currentPage = 1;
        this.currentSpreadIndex = 0;
        if (this.chapters.length > 0) this.selectedChapterId = this.chapters[0].id;
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      await this.loadProjectDetails();
    } finally {
      this.isLoading = false;
    }
  }

  async loadProjectDetails() {
    try {
      const res: any = await firstValueFrom(this.http.get(this.api.projects.details(String(this.projectId))));
      if (res?.status) {
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
    this.selectedChapterId = Number(chapterId);
    this.isLoading = true;
    try {
      const res: any = await this.http
        .get(this.api.chapters.paragraphs(String(chapterId)))
        .toPromise();

      if (res?.status) {
        this.paragraphs = res.data;
        const title = titleFromList ?? (this.chapters.find(c => c.id === chapterId)?.title ?? 'Chapter');

        // Build flow from paragraphs
        const flow = this.paragraphs.map((p: any) => ({
          id: 'p-' + p.id,
          type: 'p' as const,
          text: p.text,
          chapterId
        }));

        // Generate pages
        this.pages = paginateFlow(flow, { title }, this.chapters);
        this.pageEls = this.makePageElements(this.pages);
        this.cdr.detectChanges();
        setTimeout(() => {
          this.setFrameMetrics();
          this.ensureEdges();
        }, 0);


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

  onSpreadChange(leftPage: number, totalPages: number) {
    if (!totalPages) return;
    // قد يتغير ارتفاع عنصر الكتاب أثناء السبرد — نقرأه أولًا ثم نطبّق الحواف
    this.setFrameMetrics();
    this.totalPages = totalPages;
    this.applyForeEdges(leftPage, totalPages);
  }


  private applyForeEdges(leftPage: number, totalPages: number) {
    const el = this.frameRef?.nativeElement || document.querySelector('.book-frame');
    if (!el) return;

    const { leftPx, rightPx, readCount, remainCount } = computeEdges(leftPage, totalPages);

    // سماكة الحواف الجانبية
    el.style.setProperty('--edge-left', `${leftPx}px`);
    el.style.setProperty('--edge-right', `${rightPx}px`);

    // نسب القراءة (0 إلى 1)
    const readRatio = totalPages > 0 ? readCount / totalPages : 0;
    const remainRatio = totalPages > 0 ? remainCount / totalPages : 0;

    //  إعدادات الإزاحة الجانبية
    const baseOffset = -4.25;
    const maxOffset = 6;

    const leftOffset = baseOffset - (readRatio * maxOffset);
    const rightOffset = baseOffset - (remainRatio * maxOffset);

    // إعدادات الارتفاع
    const baseHeight = 597;
    const maxHeight = 610;

    // دالة لحساب الارتفاع بناءً على عدد الصفحات
    const computeHeight = (pages: number) => {
      console.log(pages);

      if (pages <= 0) return baseHeight;
      if (pages === 2) return 596;
      if (pages === 4) return 600;
      if (pages === 6) return 603;
      if (pages === 8) return 608;

      // بعد الصفحة الرابعة، ندأ بالزيادة البطيئة بالأعشار
      const capped = Math.min(pages, totalPages); // تأكد ألا تتعدى المجموع
      const extra = Math.min((capped - 7) * 0.25, maxHeight - 608); // 0.25px لكل صفحة تقريبًا
      return 606 + extra;
    };

    // 🧮 نحسب ارتفاع الجهتين بناءً على عدد الصفحات المقروءة والمتبقية
    const leftHeight = computeHeight(readCount);
    const rightHeight = computeHeight(remainCount);

    // حدّث القيم في الـ CSS
    el.style.setProperty('--offset-left', `${leftOffset.toFixed(1)}px`);
    el.style.setProperty('--offset-right', `${rightOffset.toFixed(1)}px`);
    el.style.setProperty('--page-h-left', `${leftHeight.toFixed(2)}px`);
    el.style.setProperty('--page-h-right', `${rightHeight.toFixed(2)}px`);
  }

  private ensureEdges() {
    const el = this.getFrameEl();
    if (!this.flipComp || !el) {
      requestAnimationFrame(() => this.ensureEdges());
      return;
    }
    // أولًا اضبط المقاسات الفعلية للكتاب داخل الإطار
    this.setFrameMetrics();

    const total = this.flipComp.getCount?.() ?? this.totalPages ?? 1;
    const idx = this.flipComp.getIndex?.() ?? 1;   // 1-based
    this.applyForeEdgesByIndex(idx, total);
  }

  private getLayoutConfig() {
    return {
      settings: {
        page: this.settings.page,
        typography: {
          font: this.settings.fontFamily,
          size: this.settings.fontSize,
          lineHeight: this.settings.lineHeight,
        },
        theme: this.settings.theme,
        spread: this.settings.spreadMode,
        rtl: this.settings.rtl,
      },
    } as any;
  }


  private applyForeEdgesByIndex(index1Based: number, total: number) {
    // حدد رقم صفحة اليسار داخل السبريد الحالي
    const left = index1Based % 2 === 0 ? index1Based - 1 : index1Based;
    this.applyForeEdges(left, total);
  }

  getChapterTitle(): string {
    return this.chapters.find(c => c.id === this.selectedChapterId)?.title ?? '';
  }

  onFlipStart() {
    this.isFlipping = true;

    // احفظ الصفحة الحالية كبداية
    this.flipStartIndex = this.flipComp?.getIndex?.() ?? this.currentPage;

    // طبّق كلاسات الاتجاه
    const frame = this.getFrameEl();
    if (frame) {
      frame.classList.add('flipping');
      frame.classList.toggle('flip-right', this.lastDir === 'right');
      frame.classList.toggle('flip-left', this.lastDir === 'left');
      frame.style.setProperty('--spine-opacity', '0'); // اختياري
    }

    // Fail-safe: لو ما أجانا flipComplete ولا pointerup لسبب ما
    window.clearTimeout(this.flipFailSafe);
    this.flipFailSafe = window.setTimeout(() => {
      if (this.isFlipping) this.resetFlipUi();
    }, 9000); // نفس مدة أنيميشنك تقريبًا + هامش بسيط
  }

  onFlipComplete() {
    // تم التقليب فعلاً => رجّع الحالة طبيعي
    window.clearTimeout(this.flipFailSafe);
    this.resetFlipUi();
  }

  // دالة تعيد كل شيء لوضعه الطبيعي (تُستخدم في الإلغاء والاكتمال)
  private resetFlipUi() {
    this.isFlipping = false;
    const frame = this.getFrameEl();
    if (frame) {
      frame.classList.remove('flipping', 'flip-right', 'flip-left');
      frame.style.setProperty('--spine-opacity', '1');
    }
  }
  

  @HostListener('window:pointerup')
  onWindowPointerUp() {
    if (!this.isFlipping) return;

    const idxNow = this.flipComp?.getIndex?.() ?? this.currentPage;
    // ما تغيّر الإندكس = ما صار قلب فعلي => إلغاء
    if (idxNow === this.flipStartIndex) {
      window.clearTimeout(this.flipFailSafe);
      this.resetFlipUi();
    }
  }

  nextPage() {
    if (this.flipComp?.canGoNext()) {
      this.lastDir = 'right';
      this.flipComp.next();
      this.audioSfx.play('flip');
    }
  }

  prevPage() {
    if (this.flipComp?.canGoPrev()) {
      this.lastDir = 'left';
      this.flipComp.prev();
      this.audioSfx.play('flip');
    }
  }

  private getFrameEl(): HTMLElement | null {
    return this.frameRef?.nativeElement ?? document.querySelector('.book-frame');
  }
  private triggerFlipAnimation() {
    this.isFlipping = true;
    setTimeout(() => {
      this.isFlipping = false;
    }, 600);
  }

  goToChapter(chapterId: number) {
    const id = Number(chapterId);
    const pageIndex = this.pages.findIndex(p => Number(p.chapterId) === id);
    if (pageIndex >= 0 && this.flipComp) {
      this.selectedChapterId = id; // تفادي وميض لحظي قبل onPageChange
      this.flipComp.goTo(pageIndex);
      this.showChaptersSidebar = false;
    } else if (this.project) {
      const chapter = this.chapters.find(c => c.id === id);
      if (chapter) this.selectChapter(id, chapter.title);
    }
  }

  onPageChange(e: { index: number; total: number }) {
    this.currentPage = e.index;
    this.totalPages = e.total;
    this.currentSpreadIndex = Math.floor((e.index - 1) / 2);

    const cid = this.getActiveChapterIdForIndex(e.index);
    if (cid !== null) this.selectedChapterId = cid;

    this.saveState();

    // أعِد ضبط مقاسات الإطار ثم طبّق الحواف
    this.setFrameMetrics();
    this.applyForeEdgesByIndex(e.index, e.total);
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

  // --- 6) في repaginate: مرّر نفس bookForLayout المبني من settings فقط ---
  private repaginate() {
    if (this.flow.length > 0) {
      const currentIndex = (this.flipComp ? this.flipComp.getIndex() - 1 : this.currentPage - 1);
      const currentChapterId = this.selectedChapterId;

      this.pages = paginateFlow(this.flow, this.getLayoutConfig(), this.chapters)
        .map(p => ({ ...p, chapterId: Number(p.chapterId) }));

      this.totalPages = this.pages.length;
      this.pageEls = this.makePageElements(this.pages);

      this.cdr.detectChanges();

      let targetPageIndex = Math.min(Math.max(currentIndex, 0), this.pages.length - 1);
      if (!this.pages[targetPageIndex]) targetPageIndex = 0;

      if (currentChapterId != null) {
        const fallback = this.pages.findIndex(p => Number(p.chapterId) === Number(currentChapterId));
        if (fallback >= 0) targetPageIndex = fallback;
      }

      if (this.flipComp) {
        setTimeout(() => {
          this.flipComp!.goTo(targetPageIndex);
          this.setFrameMetrics();
          this.ensureEdges();
        }, 100);
      }
    }
  }

  // --- 3) أضِف دالة صغيرة تطبق الإعدادات والصوت من الثوابت ---
  private initConfigFromJson() {
    const s = JSON_CONFIG.settings;
    const snd = JSON_CONFIG.sounds;

    this.settings = {
      fontFamily: s.typography.font,
      fontSize: s.typography.size,
      lineHeight: s.typography.lineHeight,
      theme: s.theme,
      spreadMode: s.spread,
      rtl: s.rtl,
      page: { ...s.page },
      audioEnabled: snd.enabled,
      audioVolume: snd.volume,
    };

    this.audioSfx.init(
      { flip: snd.flip, drag: snd.drag },
      snd.enabled,
      snd.volume
    );
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


  private setFrameMetrics() {
    const frame = this.frameRef?.nativeElement;
    const host = frame?.querySelector('app-book-flip') as HTMLElement;
    if (!frame || !host) return;

    const rect = host.getBoundingClientRect();
    // لو المكوّن الداخلي يرسم داخل عنصر child، خذ child.firstElementChild بدل host
    const inner = host.firstElementChild as HTMLElement || host;
    const r = (inner.getBoundingClientRect().width > 0 ? inner : host).getBoundingClientRect();

    // قياسات الصفحات الفعلية
    const pageW = Math.round(r.width);
    const pageH = Math.round(r.height);

    this.renderer.setStyle(frame, '--page-w', `${pageW}px`);
    this.renderer.setStyle(frame, '--page-h', `${pageH}px`);

    // مزامنة لون الورق مع .pg لو عدّلته لاحقًا (اختياري)
    // this.renderer.setStyle(frame, '--paper-top', '#fffdfa');
    // this.renderer.setStyle(frame, '--paper-bot', '#fdfcf7');

    // بعد ضبط المقاسات، أعِد تطبيق الحواف
    const total = this.flipComp?.getCount?.() ?? this.totalPages ?? 1;
    const idx = this.flipComp?.getIndex?.() ?? 1;
    this.applyForeEdgesByIndex(idx, total);
  }


  private makePageElements(pages: Page[]): HTMLElement[] {
    return pages.map(p => {
      const el = document.createElement('div');
      el.className = 'page'; // PageFlip يتوقع class=page
      el.innerHTML = `
      <div class="page-content">${p.html}</div>
    `;
      return el;
    });
  }

  @HostListener('window:resize')
  onResize() {
    // مع الريسايز، نقرأ المقاسات من جديد ثم نعيد حساب الحواف
    this.setFrameMetrics();
    const total = this.flipComp?.getCount?.() ?? this.totalPages ?? 1;
    const idx = this.flipComp?.getIndex?.() ?? 1;
    this.applyForeEdgesByIndex(idx, total);
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

  private getActiveChapterIdForIndex(idx1Based: number): number | null {
    const left = this.pages[idx1Based - 1];
    const right = this.pages[idx1Based]; // قد تكون undefined في آخر صفحة
    // نفضل اليمنى إن وُجدت لأنها غالبًا بداية الفصل
    const cid = (right?.chapterId ?? left?.chapterId);
    return (cid !== undefined && cid !== null) ? Number(cid) : null;
  }
}
