import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input,
  OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, NgZone, Inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PageFlip, FlipSetting } from 'page-flip';

@Component({
  selector: 'app-book-flip',
  template: `
    <div class="book-host-wrap">
      <div #host class="book-host"></div>
      <!-- 🛡️ Overlay يمنع أي events تصل للمكتبة إلا بعد الضغط -->
      <div #guard class="drag-guard" aria-hidden="true"></div>
    </div>
  `,
  styleUrls: ['./book-flip.component.css']
})
export class BookFlipComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('host',  { static: true }) host!: ElementRef<HTMLDivElement>;
  @ViewChild('guard', { static: true }) guard!: ElementRef<HTMLDivElement>;

  @Input() pages: HTMLElement[] = [];
  @Input() width = 820;
  @Input() height = 800;

  @Input() flippingTime = 800;
  @Input() maxShadowOpacity = 0.35;
  @Input() showCover = false;
  @Input() autoSize = true;
  @Input() mobileScrollSupport = false;
  @Input() swipeDistance = 30;
  @Input() usePortrait = false;
  @Input() soundEnabled = true;

  @Output() pageChange   = new EventEmitter<{ index: number; total: number }>();
  @Output() flipStart    = new EventEmitter<void>();
  @Output() flipComplete = new EventEmitter<void>();
  @Output() spreadChange = new EventEmitter<{ left: number; total: number }>();
  @Output() dragProgress = new EventEmitter<number>(); // 0..1 (لو حبيت تربط الظلال)

  private flip?: PageFlip;
  private ro?: ResizeObserver;
  private isDragging = false;
  private isBrowser = true;

  // للـ progress الاختياري
  private pointerActive = false;
  private frameRect!: DOMRect;
  private dragSide: 'left' | 'right' = 'right';

  // لإدارة الحارس
  private guardEnabled = true;

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // جهّز الحارس قبل التهيئة
    this.enableGuard();

    (document as any).fonts?.ready?.then?.(() => this.initFlip()) ?? this.initFlip();
    this.attachResizeObserver();
    this.bindGuardHandlers();        // أحداث الحارس
    this.bindPointerProgress();      // اختياري للظلال الواقعية
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.flip) return;

    if (changes['width'] || changes['height']) {
      const idx0 = this.getIndex0();
      this.reinitPreserveIndex(idx0);
      return;
    }

    if (changes['pages'] && this.pages?.length) {
      const idx0 = this.getIndex0();
      this.safeUpdateFromHtml(idx0);
    }
  }

  ngOnDestroy(): void {
    this.detachResizeObserver();
    this.unbindGuardHandlers();
    this.unbindPointerProgress();
    this.flip?.destroy();
  }

  // ======== Public API ========
  next(): void { this.flip?.flipNext(); }
  prev(): void { this.flip?.flipPrev(); }
  goTo(i: number): void { this.flip?.flip(i); }

  getIndex(): number { return this.getIndex0() + 1; }
  getCount(): number { return this.flip?.getPageCount() ?? 0; }
  canGoNext(): boolean { return this.getIndex() < this.getCount(); }
  canGoPrev(): boolean { return this.getIndex() > 1; }

  // ======== Init / Update ========
  private initFlip(): void {
    const settings: Partial<FlipSetting> = {
      width: this.width,
      height: this.height,
      size: 'stretch' as any,
      usePortrait: this.usePortrait,
      showCover: this.showCover,
      drawShadow: true,
      maxShadowOpacity: this.maxShadowOpacity,
      flippingTime: this.flippingTime,
      mobileScrollSupport: this.mobileScrollSupport,
      autoSize: this.autoSize,
      swipeDistance: this.swipeDistance,
      startPage: 0,
      showPageCorners: false,
    };

    this.flip = new PageFlip(this.host.nativeElement, settings);
    if (this.pages?.length) this.flip.loadFromHTML(this.pages);

    // Events
    this.flip.on('flip', (e: any) => {
      this.zone.run(() => {
        this.flipComplete.emit();
        const current = (e.data ?? 0) + 1;
        const total = this.getCount();
        this.pageChange.emit({ index: current, total });
        const leftPage = current % 2 === 0 ? current - 1 : current;
        this.spreadChange.emit({ left: leftPage, total });
      });
    });

    this.flip.on('changeState', (evt: any) => {
      const val = typeof evt?.data === 'string' ? evt.data : String(evt?.data ?? '');
      if ((/user_fold/i).test(val)) {
        if (!this.isDragging) {
          this.isDragging = true;
          this.zone.run(() => this.flipStart.emit());
        }
      } else if ((/read/i).test(val)) {
        this.isDragging = false;
        this.zone.run(() => this.dragProgress.emit(0));
      }
    });

    setTimeout(() => {
      this.zone.run(() => {
        const current = this.getIndex();
        const total = this.getCount();
        this.pageChange.emit({ index: current, total });
        const leftPage = current % 2 === 0 ? current - 1 : current;
        this.spreadChange.emit({ left: leftPage, total });
      });
    }, 60);
  }

  private reinitPreserveIndex(idx0: number) {
    this.flip?.destroy();
    this.initFlip();
    this.clampAndGo(idx0);
    this.zone.run(() => this.pageChange.emit({ index: this.getIndex(), total: this.getCount() }));
  }

  private safeUpdateFromHtml(idx0: number) {
    this.flip!.updateFromHtml(this.pages);
    this.clampAndGo(idx0);
    this.zone.run(() => this.pageChange.emit({ index: this.getIndex(), total: this.getCount() }));
  }

  private clampAndGo(idx0: number) {
    const total = this.getCount();
    if (total === 0) return;
    const target = Math.max(0, Math.min(idx0, total - 1));
    this.flip!.flip(target);
  }

  private getIndex0(): number {
    return this.flip ? (this.flip.getCurrentPageIndex() ?? 0) : 0;
  }

  // ======== ResizeObserver ========
  private attachResizeObserver() {
    if (!('ResizeObserver' in window)) return;
    this.ro = new ResizeObserver(() => {
      if (!this.flip || !this.pages?.length) return;
      const idx0 = this.getIndex0();
      this.flip.updateFromHtml(this.pages);
      this.clampAndGo(idx0);
      this.zone.run(() => this.pageChange.emit({ index: this.getIndex(), total: this.getCount() }));
    });
    this.ro.observe(this.host.nativeElement);
  }
  private detachResizeObserver() { this.ro?.disconnect(); this.ro = undefined; }

  // ======== 🛡️ Guard Overlay: لا سحب إلا بعد ضغط ========
  private bindGuardHandlers() {
    const guard = this.guard.nativeElement;

    // أهم حدث: pointerdown على الحارس
    guard.addEventListener('pointerdown', this.onGuardPointerDown, { passive: false });
    window.addEventListener('pointerup', this.onGuardPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.onGuardPointerUp as any, { passive: true });
    window.addEventListener('blur', this.onGuardPointerUp as any, { passive: true });
  }

  private unbindGuardHandlers() {
    const guard = this.guard?.nativeElement;
    if (!guard) return;
    guard.removeEventListener('pointerdown', this.onGuardPointerDown as any);
    window.removeEventListener('pointerup', this.onGuardPointerUp as any);
    window.removeEventListener('pointercancel', this.onGuardPointerUp as any);
    window.removeEventListener('blur', this.onGuardPointerUp as any);
  }

  private enableGuard() {
    this.guardEnabled = true;
    this.guard?.nativeElement.classList.add('is-active');
  }

  private disableGuard() {
    this.guardEnabled = false;
    this.guard?.nativeElement.classList.remove('is-active');
  }

  // لما يضغط المستخدم على الحارس: نفك القفل فورًا ونمرّر ضغطة صناعية لنفس النقطة
  private onGuardPointerDown = (e: PointerEvent) => {
    if (!this.guardEnabled) return;

    e.preventDefault(); // مهم حتى ما يروح الحدث
    const guardEl = this.guard.nativeElement;
    const hostEl  = this.host.nativeElement;

    // فكّ القفل الآن
    this.disableGuard();

    // 👇 نعمل hit-test بعد إخفاء الحارس ونبعت mousedown/pointerdown صناعي للعنصر تحت المؤشر
    const { clientX, clientY } = e;
    const targetUnder = document.elementFromPoint(clientX, clientY) as Element | null;

    // نثبت التركيز عند host (مفيد للمفاتيح)
    hostEl.focus?.();

    // Dispatch synthetic pointerdown/mousedown لكي تلتقطها المكتبة فورًا
    const ptr = new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, pointerId: e.pointerId, pointerType: e.pointerType,
      clientX, clientY, buttons: e.buttons || 1
    });
    targetUnder?.dispatchEvent(ptr);

    const md = new MouseEvent('mousedown', {
      bubbles: true, cancelable: true, clientX, clientY, buttons: e.buttons || 1, button: 0
    });
    targetUnder?.dispatchEvent(md);

    // ابدأ حساب progress (اختياري)
    this.pointerActive = true;
    const rect = hostEl.getBoundingClientRect();
    this.frameRect = rect;
    const cx = rect.left + rect.width / 2;
    this.dragSide = (clientX >= cx) ? 'right' : 'left';
    this.emitProgress(0);
  };

  private onGuardPointerUp = () => {
    if (this.guardEnabled) return; // أصلاً مقفول
    // أرجع الحارس بعد إفلات الضغط بقليل (يسمح للمكتبة تُنهي أي click)
    setTimeout(() => this.enableGuard(), 0);
    // صفّر progress الاختياري
    this.pointerActive = false;
    this.emitProgress(0);
  };

  // ======== (اختياري) Pointer progress للظلال الواقعية ========
  private pointerMove = (e: PointerEvent) => {
    if (!this.pointerActive) return;
    e.preventDefault();
    const cx = this.frameRect.left + this.frameRect.width / 2;
    const half = this.frameRect.width / 2;
    const dx = (this.dragSide === 'right') ? Math.max(0, e.clientX - cx) : Math.max(0, cx - e.clientX);
    const progress = Math.min(1, Math.max(0, dx / half));
    this.emitProgress(progress);
  };

  private bindPointerProgress() {
    // نقرأ الحركة من النافذة كاملة (بعد فتح القفل)
    window.addEventListener('pointermove', this.pointerMove, { passive: false });
  }
  private unbindPointerProgress() {
    window.removeEventListener('pointermove', this.pointerMove as any);
  }

  private emitProgress(v: number) {
    this.zone.run(() => this.dragProgress.emit(+v.toFixed(3)));
  }
}
