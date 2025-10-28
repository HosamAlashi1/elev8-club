import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input,
  OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject, NgZone
} from '@angular/core';
import { PageFlip, FlipSetting } from 'page-flip';
import { AudioSfxService } from '../../services/audio-sfx.service';

@Component({
  selector: 'app-book-flip',
  template: `<div #host class="book-host"></div>`,
  styleUrls: ['./book-flip.component.css']
})
export class BookFlipComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  @Input() pages: HTMLElement[] = [];
  @Input() width = 820;
  @Input() height = 800;
  @Input() soundEnabled = true;

  @Output() pageChange = new EventEmitter<{ index: number; total: number }>();
  @Output() flipStart = new EventEmitter<void>();
  @Output() flipComplete = new EventEmitter<void>();
  @Output() spreadChange = new EventEmitter<{ left: number; total: number }>();

  private flip?: PageFlip;
  private resizeHandler = () => { };
  private readonly audioSfx = inject(AudioSfxService);
  private readonly zone = inject(NgZone);
  private isDragging = false;

  ngAfterViewInit(): void {
    this.initFlip();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.flip) return;

    // لو تغيّر الحجم المدخل، أعد التهيئة بالكامل
    if (changes['width'] || changes['height']) {
      const idx0 = this.getIndex0();
      this.reinitPreserveIndex(idx0);
      return;
    }

    // لو تغيّرت الصفحات: حدّث المحتوى مع الحفاظ على الصفحة الحالية
    if (changes['pages'] && this.pages?.length) {
      const idx0 = this.getIndex0();
      this.safeUpdateFromHtml(idx0);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
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

  // ======== Private ========

  private initFlip(): void {
    const settings: Partial<FlipSetting> = {
      width: this.width,
      height: this.height,
      size: 'stretch' as any,   // يتمدّد مع الحاوية
      usePortrait: false,       // وضع صفحتين غالباً (يتحوّل تلقائيًا حسب الأبعاد)
      showCover: false,
      drawShadow: true,
      maxShadowOpacity: 0.35,
      flippingTime: 700,
      mobileScrollSupport: false,
      useMouseEvents: true
    };

    this.flip = new PageFlip(this.host.nativeElement, settings);

    if (this.pages?.length) {
      this.flip.loadFromHTML(this.pages);
    }

    // Events: اشتغل جوّا الـ Zone
    this.flip.on('flip', (e: any) => {
      this.zone.run(() => {
        if (this.soundEnabled) this.audioSfx.play('flip');
        this.flipComplete.emit();

        const current = (e.data ?? 0) + 1;          // رقم الصفحة الحالي (1-based)
        const total = this.getCount();
        this.pageChange.emit({ index: current, total });

        // 👇 أرسل السبريد (يسار الصفحة الحالية)
        const leftPage = current % 2 === 0 ? current - 1 : current;
        this.spreadChange.emit({ left: leftPage, total });
      });
    });

    this.flip.on('changeState', (e: any) => {
      // user_fold / flipping / read ...
      const state = e?.data;
      if (state === 'user_fold' && !this.isDragging) {
        this.isDragging = true;
        if (this.soundEnabled) this.audioSfx.play('drag');
        this.zone.run(() => this.flipStart.emit());
      } else if (state === 'read') {
        this.isDragging = false;
      }
    });

    // Emit initial
    setTimeout(() => {
      this.zone.run(() => {
        const current = this.getIndex();
        const total = this.getCount();
        this.pageChange.emit({ index: current, total });

        const leftPage = current % 2 === 0 ? current - 1 : current;
        this.spreadChange.emit({ left: leftPage, total });
      });
    }, 60);

    // Handle resize: أعد التحديث بدون فقد الصفحة
    this.resizeHandler = () => {
      if (!this.flip || !this.pages?.length) return;
      const idx0 = this.getIndex0();
      this.flip.updateFromHtml(this.pages);
      this.clampAndGo(idx0);
      this.zone.run(() => this.pageChange.emit({ index: this.getIndex(), total: this.getCount() }));
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  private reinitPreserveIndex(idx0: number) {
    this.flip?.destroy();
    this.initFlip();
    this.clampAndGo(idx0);
    this.zone.run(() => this.pageChange.emit({ index: this.getIndex(), total: this.getCount() }));
  }

  private safeUpdateFromHtml(idx0: number) {
    // تحديث لطيف يحافظ على الصفحة الحالية قدر الإمكان
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
}
