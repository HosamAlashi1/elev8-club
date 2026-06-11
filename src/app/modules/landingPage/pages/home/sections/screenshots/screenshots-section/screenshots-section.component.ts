import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FirebaseService } from 'src/app/modules/services/firebase.service';

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
  private readonly preloadedImages: HTMLImageElement[] = [];
  private readonly destroy$ = new Subject<void>();

  /**
   * صور الكاروسيل. حالياً صور مؤقتة من النظام (placeholder).
   * استبدلها بسكرين شوتاتك الحقيقية لاحقاً — بنفس الترتيب.
   * يفضّل 7 صور أو أكثر حتى يصير الـ wrap خلف الكواليس بدون قفزة.
   */
  readonly slides: string[] = [
    'assets/images/screenshots/elev8-screenshot-01.jpeg',
    'assets/images/screenshots/elev8-screenshot-02.jpeg',
    'assets/images/screenshots/elev8-screenshot-03.jpeg',
    'assets/images/screenshots/elev8-screenshot-04.jpeg',
    'assets/images/screenshots/elev8-screenshot-05.jpeg',
    'assets/images/screenshots/elev8-screenshot-06.jpeg',
    'assets/images/screenshots/elev8-screenshot-07.jpeg',
    'assets/images/screenshots/elev8-screenshot-08.jpeg',
    'assets/images/screenshots/elev8-screenshot-09.jpeg',
    'assets/images/screenshots/elev8-screenshot-10.jpeg',
    'assets/images/screenshots/elev8-screenshot-11.jpeg',
    'assets/images/screenshots/elev8-screenshot-12.jpeg',
    'assets/images/screenshots/elev8-screenshot-13.jpeg',
    'assets/images/screenshots/elev8-screenshot-14.jpeg',
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
    private readonly firebaseService: FirebaseService
  ) {
    this.updateSlideStates();
    this.preloadSlides();
  }

  ngOnInit(): void {
    this.loadChallengeDate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
  }

  private loadChallengeDate(): void {
    this.firebaseService
      .getObject('settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: any) => {
        const startDate = this.parseDate(settings?.start_counter_date);

        if (!startDate) {
          return;
        }

        this.challengeDateLabel = this.formatShortDate(startDate);
        this.cdr.markForCheck();
      });
  }

  private parseDate(dateValue: any): number {
    if (!dateValue) return 0;

    if (typeof dateValue === 'number') {
      return dateValue < 10000000000 ? dateValue * 1000 : dateValue;
    }

    if (typeof dateValue === 'string') {
      const trimmedValue = dateValue.trim();
      const numericValue = Number(trimmedValue);

      if (!Number.isNaN(numericValue)) {
        return numericValue < 10000000000 ? numericValue * 1000 : numericValue;
      }

      const timestamp = new Date(trimmedValue).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    }

    return 0;
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
    this.go(1, 'next');
  }

  prevSlide(): void {
    this.go(-1, 'prev');
  }

  trackBySlideSrc(_index: number, slide: SlideState): string {
    return slide.src;
  }

  openImagePreview(slide: SlideState): void {
    if (!slide.isCenter) {
      return;
    }

    this.selectedImage = slide.src;
  }

  closeImagePreview(): void {
    this.selectedImage = null;
    this.cdr.markForCheck();
  }

  private go(step: number, direction: 'next' | 'prev'): void {
    this.slideDirection = direction;
    this.activeIndex =
      (this.activeIndex + step + this.slides.length) % this.slides.length;
    this.updateSlideStates();
    this.isAnimating = true;

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
      this.cdr.markForCheck();
    }, 520);
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

  private preloadSlides(): void {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return;
    }

    const load = () => {
      this.slides.forEach((src) => {
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
}
