import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

type SlideItem = {
  src: string;
  alt: string;
};

@Component({
  selector: 'app-written-testimonials-section',
  template: `
    <section class="screens-section">
      <div class="screens-inner">
        <div class="screens-content" data-aos="fade-left" data-aos-delay="80">
          <div class="screens-head">
            <span class="screens-eyebrow">سكرينات</span>
            <h2>عندي حرفيا مئات الـ screenshots ومئات النتائج</h2>
            <p>لأشخاص قدروا يحققوا نتائج حقيقية باستخدام هذا النظام.</p>
          </div>

          <div class="screens-slider" data-aos="zoom-in" data-aos-delay="160">
            <swiper-container
              #screensSwiper
              class="screens-swiper"
              init="false"
              dir="rtl"
              aria-label="Screenshots slider"
            >
              <swiper-slide *ngFor="let slide of slides">
                <figure class="screen-card">
                  <img [src]="slide.src" [alt]="slide.alt" loading="lazy">
                </figure>
              </swiper-slide>
            </swiper-container>
          </div>

          <div class="screens-details" data-aos="fade-up" data-aos-delay="220">
            <div class="promise-copy">
              <p class="promise-inline">
                <ng-container *ngFor="let point of proofPoints; let last = last">
                  <span>{{ point }}</span>
                  <span class="promise-separator" *ngIf="!last">•</span>
                </ng-container>
              </p>
            </div>

            <button class="btn-cta btn-cta-primary btn-cta-lg" (click)="onOpenRegistration()">
              <span class="btn-cta-text">احجز مقعدك مجانًا</span>
              <div class="ripple-gold"></div>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./written-testimonials-section.component.css']
})
export class WrittenTestimonialsSectionComponent implements AfterViewInit, OnDestroy {
  @Input() onOpenRegistration!: () => void;
  @ViewChild('screensSwiper') private screensSwiper?: ElementRef<any>;

  readonly slides: SlideItem[] = [
    {
      src: 'assets/images/canva/trading-screenshot.png',
      alt: 'نتيجة تداول حقيقية'
    },
    {
      src: 'assets/images/canva/video-proof-massy.png',
      alt: 'لقطة أرباح من المشاركين'
    },
    {
      src: 'assets/images/canva/video-proof-salah.png',
      alt: 'إثبات نتائج إضافي'
    },
    {
      src: 'assets/images/canva/elev8-instagram.jpg',
      alt: 'نتيجة من حساب اجتماعي'
    }
  ];

  readonly proofPoints = [
    'يوم ،20/5 راح أفرجيك بشكل مباشر، قدام الكاميرا، خطوة بخطوة…',
    'مش حكي نظري. خلال جلسة مدتها ساعة تقريبا، وفي آخر ربع ساعة… راح نطبق التداول بشكل مباشر live حتى تشوف الخطوات بعينك وتفهم كيف تبدأ بنفسك.',
    'وقدرت من خلال المجال هذا أحقق آلاف الدولارات، وأساعد ناس كثير يبدؤوا أول خطوة إلهم بشكل صحيح.',
    'وبنهاية الجلسة، رح يكون عندك وضوح كامل عن كيف تبدأ التداول بدون عشوائية.'
  ];

  ngAfterViewInit(): void {
    this.initializeSwiper();
  }

  ngOnDestroy(): void {
    this.screensSwiper?.nativeElement?.swiper?.destroy?.(true, true);
  }

  private initializeSwiper(): void {
    const swiperElement = this.screensSwiper?.nativeElement;

    if (!swiperElement) {
      return;
    }

    Object.assign(swiperElement, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 14,
      speed: 900,
      grabCursor: true,
      loop: this.slides.length > 1,
      autoplay: this.slides.length > 1
        ? {
            delay: 3200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
        : false,
      pagination: {
        clickable: true
      },
      breakpoints: {
        681: {
          slidesPerView: 2,
          slidesPerGroup: 1,
          spaceBetween: 14
        }
      }
    });

    swiperElement.initialize?.();
  }
}
