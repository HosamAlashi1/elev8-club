import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LandingSettingsService } from 'src/app/modules/services/landing-settings.service';

type SlideState = {
  src: string;
  offset: number;
  isCenter: boolean;
};

@Component({
  selector: 'app-screenshots-section',
  templateUrl: './screenshots-section.component.html',
  styleUrls: ['./screenshots-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenshotsSectionComponent implements OnInit, OnDestroy {
  activeIndex = 0;
  isAnimating = false;
  slideDirection: 'next' | 'prev' = 'next';
  slideStates: SlideState[] = [];
  selectedImage: string | null = null;
  challengeDateLabel = 'قريباً';

  private animationTimer?: ReturnType<typeof setTimeout>;
  private autoSlideTimer?: ReturnType<typeof setTimeout>;
  private readonly autoSlideDelayMs = 4000;
  private readonly preloadedImages: HTMLImageElement[] = [];
  private readonly preloadedImageSources = new Set<string>();
  private readonly destroy$ = new Subject<void>();

  /**
   * صور الكاروسيل. حالياً صور مؤقتة من النظام (placeholder).
   * استبدلها بسكرين شوتاتك الحقيقية لاحقاً — بنفس الترتيب.
   * يفضّل 7 صور أو أكثر حتى يصير الـ wrap خلف الكواليس بدون قفزة.
   */
  readonly slides: string[] = [
    'assets/images/screenshots/elev8-screenshot-11.webp',
    'assets/images/screenshots/elev8-screenshot-01.webp',
    'assets/images/screenshots/elev8-screenshot-02.webp',
    'assets/images/screenshots/elev8-screenshot-03.webp',
    'assets/images/screenshots/elev8-screenshot-04.webp',
    'assets/images/screenshots/elev8-screenshot-05.webp',
    'assets/images/screenshots/elev8-screenshot-06.webp',
    'assets/images/screenshots/elev8-screenshot-07.webp',
    'assets/images/screenshots/elev8-screenshot-08.webp',
    'assets/images/screenshots/elev8-screenshot-09.webp',
    'assets/images/screenshots/elev8-screenshot-10.webp',
    'assets/images/screenshots/elev8-screenshot-12.webp',
    'assets/images/screenshots/elev8-screenshot-13.webp',
    'assets/images/screenshots/elev8-screenshot-14.webp',
    'assets/images/screenshots/elev8-screenshot-15.webp',
  ];

  /** نصوص الكروت الأربعة أسفل السكشن — بترتيب DOM يسار ← يمين (نفس الأنيما). */
  get cards(): string[] {
    return [
      'و بنهاية المكالمة ، رح يكون عندك وضوح كامل عن كيف تبدأ التداول بدون عشوائية.',
      'وخليني اقلك انه قدرت من خلال المجال هذا أحقق آلاف الدولارات، وأساعد ناس ألاف الشباب يبدؤوا أول خطوة إلهم بشكل صحيح',
      'خلال جلسة مدتها ساعة تقريبًا، وفي آخر ربع ساعة … راح نطبّق التداول بشكل مباشر live حتى تشوف الخطوات بعينك وتفهم كيف تبدأ بنفسك',
      `يوم ${this.challengeDateLabel}، راح أفرجيك بشكل مباشر، قدام الكاميرا، خطوة بخطوة… كيف ناس كثير قدروا يبدؤوا بالتداول بالطريقة الصح وكيف أنت كمان تقدر تعمل نفس الشي`,
    ];
  }

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly landingSettings: LandingSettingsService
  ) {
    this.updateSlideStates();
    this.preloadNearbySlides(1);
  }

  ngOnInit(): void {
    this.loadChallengeDate();
    this.scheduleAutoSlide();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    this.clearAutoSlideTimer();
  }

  private loadChallengeDate(): void {
    this.landingSettings
      .getStartCounterDate()
      .pipe(takeUntil(this.destroy$))
      .subscribe((startDate: number) => {
        if (!startDate) {
          return;
        }

        this.challengeDateLabel = this.formatShortDate(startDate);
        this.cdr.markForCheck();
      });
  }

  private formatShortDate(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  @HostListener('document:keydown.escape')
  closePreviewOnEscape(): void {
    if (this.selectedImage) {
      this.closeImagePreview();
    }
  }

  /** المسافة (slot) للصورة عن المركز: 0 = الوسط، ±1 و ±2 جوانب، ±3 مخبّأة (buffer) */
  offsetFor(index: number): number {
    const n = this.slides.length;
    let d = (((index - this.activeIndex) % n) + n) % n; // 0..n-1
    if (d > n / 2) {
      d -= n;
    }

    if (d > 2) {
      return 3;
    }

    if (d < -2) {
      return -3;
    }

    return d;
  }

  nextSlide(): void {
    this.go(1, 'next', true);
  }

  prevSlide(): void {
    this.go(-1, 'prev', true);
  }

  trackBySlideSrc(_index: number, slide: SlideState): string {
    return slide.src;
  }

  openImagePreview(slide: SlideState): void {
    if (!slide.isCenter) {
      return;
    }

    this.selectedImage = slide.src;
    this.clearAutoSlideTimer();
  }

  closeImagePreview(): void {
    this.selectedImage = null;
    this.scheduleAutoSlide();
    this.cdr.markForCheck();
  }

  private go(step: number, direction: 'next' | 'prev', resetAutoSlide = false): void {
    this.slideDirection = direction;
    this.activeIndex =
      (this.activeIndex + step + this.slides.length) % this.slides.length;
    this.updateSlideStates();
    this.preloadNearbySlides(2);
    this.isAnimating = true;
    this.cdr.markForCheck();

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
      this.cdr.markForCheck();
    }, 520);

    if (resetAutoSlide) {
      this.scheduleAutoSlide();
    }
  }

  private updateSlideStates(): void {
    const visibleOffsets = [-3, -2, -1, 0, 1, 2, 3];
    const total = this.slides.length;

    this.slideStates = visibleOffsets.map((offset) => {
      const index = (this.activeIndex + offset + total) % total;
      return {
        src: this.slides[index],
        offset,
        isCenter: offset === 0,
      };
    });
  }

  private preloadNearbySlides(radius = 1): void {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return;
    }

    const total = this.slides.length;
    const sources = new Set<string>();
    for (let offset = -radius; offset <= radius; offset++) {
      const index = (this.activeIndex + offset + total) % total;
      sources.add(this.slides[index]);
    }

    const load = () => {
      sources.forEach((src) => {
        if (this.preloadedImageSources.has(src)) {
          return;
        }

        this.preloadedImageSources.add(src);
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
        this.preloadedImages.push(image);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 1600 });
      return;
    }

    setTimeout(load, 700);
  }

  private scheduleAutoSlide(): void {
    this.clearAutoSlideTimer();

    if (this.slides.length < 2) {
      return;
    }

    this.autoSlideTimer = setTimeout(() => {
      this.advanceAutomatically();
    }, this.autoSlideDelayMs);
  }

  private advanceAutomatically(): void {
    if (this.isAnimating || this.selectedImage) {
      this.scheduleAutoSlide();
      return;
    }

    this.go(1, 'next');
    this.scheduleAutoSlide();
  }

  private clearAutoSlideTimer(): void {
    if (this.autoSlideTimer) {
      clearTimeout(this.autoSlideTimer);
      this.autoSlideTimer = undefined;
    }
  }
}
