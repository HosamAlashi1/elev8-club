import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

interface ProofSlide {
  name: string;
  country: string;
  role: string;
  amount: string;
  video: string;
  avatar: string;
  summary: string;
  poster?: string;
}

type SlideDirection = 'next' | 'prev';

@Component({
  selector: 'app-video-testimonials-section',
  templateUrl: './video-testimonials-section.component.html',
  styleUrls: ['./video-testimonials-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoTestimonialsSectionComponent implements AfterViewInit, OnDestroy {
  @Input() onOpenRegistration?: () => void;
  @ViewChild('proofVideo') proofVideo?: ElementRef<HTMLVideoElement>;

  activeIndex = 0;
  isAnimating = false;
  isVideoPlaying = false;
  isVideoPreparing = false;
  transitionDirection: SlideDirection = 'next';

  private animationTimer?: ReturnType<typeof setTimeout>;
  private pendingPlayToken = 0;
  private loadedVideoSource = '';
  private readonly proofAvatars = [
    'assets/images/anima-home/proof-avatar-1.webp',
    'assets/images/anima-home/proof-avatar-2.webp',
    'assets/images/anima-home/proof-avatar-3.webp',
  ] as const;
  private readonly cardAvatars = [
    'assets/img/blank.png',
    'assets/img/blank.png',
    'assets/img/blank.png',
  ] as const;

  readonly slides: ProofSlide[] = [
    {
      name: 'أمل من المغرب',
      country: 'MA',
      role: 'عندها بزنس خاص...',
      amount: '$1,009',
      video: 'assets/videos/testimonials/amal-morocco.mp4',
      poster: 'assets/images/anima-home/proof-frame-amal.webp',
      avatar: this.cardAvatars[2],
      summary: 'وخلال 5 أيام ونصف حققت $1,009.',
    },
    {
      name: 'لويس من لبنان',
      country: 'LB',
      role: 'يشتغل كوافير نسائي...',
      amount: '$1,500',
      video: 'assets/videos/testimonials/louis-lebanon.mp4',
      poster: 'assets/images/anima-home/proof-frame-louis.webp',
      avatar: this.cardAvatars[1],
      summary: 'وخلال 8 أيام ونصف وصل لـ $1,500.',
    },
    {
      name: 'أنصار من فلسطين',
      country: 'PS',
      role: 'كانت تشتغل بالمجال التسويقي...',
      amount: '+$1,000',
      video: 'assets/videos/testimonials/ansar-palestine.mp4',
      poster: 'assets/images/anima-home/proof-frame-ansar.webp',
      avatar: this.cardAvatars[1],
      summary: 'وخلال 6 أيام فقط قدرت تحقق +$1,000 لدرجة إنها قررت تترك شغلها بالكامل وتكمل بالتداول.',
    },
    {
      name: 'فادي من سوريا',
      country: 'SY',
      role: 'طالب IT ولسه بيدرس...',
      amount: '$1,500',
      video: 'assets/videos/testimonials/fadi-syria.mp4',
      poster: 'assets/images/anima-home/proof-frame-fadi.webp',
      avatar: this.cardAvatars[1],
      summary: 'خلال 8 أيام عمل $1,500 جنب دراسته.',
    },
    {
      name: 'أبو بكر من ليبيا',
      country: 'LY',
      role: 'في صيانة جوالات...',
      amount: '$384',
      video: 'assets/videos/testimonials/abubakr-libya.mp4',
      poster: 'assets/images/anima-home/proof-frame-abubakr.webp',
      avatar: this.cardAvatars[0],
      summary: 'من أول يوم معنا حقق $384.',
    },
    {
      name: 'هيثم من تركيا',
      country: 'TR',
      role: 'موظف وعنده شغل أساسي...',
      amount: '$1,075',
      video: 'assets/videos/testimonials/haitham-turkey.mp4',
      poster: 'assets/images/anima-home/proof-frame-haitham.webp',
      avatar: this.cardAvatars[2],
      summary: 'وخلال ساعتين فقط حقق $1,075.',
    },
  ];

  constructor(private readonly cdr: ChangeDetectorRef) {}

  get activeSlide(): ProofSlide {
    return this.slides[this.activeIndex];
  }

  get previewSlides(): ProofSlide[] {
    return [1, 2, 3].map((offset) => this.slides[(this.activeIndex + offset) % this.slides.length]);
  }

  get avatarStrip(): string[] {
    return [...this.proofAvatars];
  }

  ngAfterViewInit(): void {
    this.setupVideo();
  }

  ngOnDestroy(): void {
    this.pauseVideo(false);
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
  }

  nextSlide(): void {
    this.goToSlide(this.activeIndex + 1, 'next');
  }

  prevSlide(): void {
    this.goToSlide(this.activeIndex - 1, 'prev');
  }

  toggleVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video || this.isVideoPreparing) {
      return;
    }

    if (this.isVideoPlaying) {
      this.pauseVideo(false);
      return;
    }

    this.playActiveVideo();
  }

  trackBySlideName(_: number, slide: ProofSlide): string {
    return slide.name;
  }

  trackBySlideIndex(index: number): number {
    return index;
  }

  private goToSlide(index: number, direction: SlideDirection): void {
    if (this.isAnimating) {
      return;
    }

    this.pauseVideo(false);
    this.pendingPlayToken++;
    this.loadedVideoSource = '';
    this.transitionDirection = direction;
    this.activeIndex = (index + this.slides.length) % this.slides.length;
    this.isAnimating = true;
    this.cdr.markForCheck();

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }

    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
      this.cdr.markForCheck();
    }, 520);
  }

  private setupVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = false;
    video.volume = 1;
    video.preload = 'none';
    video.playsInline = true;
    video.onended = () => {
      this.isVideoPlaying = false;
      this.isVideoPreparing = false;
      video.currentTime = 0;
      this.cdr.markForCheck();
    };
  }

  private playActiveVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    const token = ++this.pendingPlayToken;
    this.isVideoPreparing = true;
    this.cdr.markForCheck();
    this.ensureActiveVideoSource(video);

    video.play()
      .then(() => {
        if (token !== this.pendingPlayToken) {
          video.pause();
          return;
        }

        this.isVideoPlaying = true;
        this.isVideoPreparing = false;
        this.cdr.markForCheck();
      })
      .catch(() => {
        if (token === this.pendingPlayToken) {
          this.isVideoPlaying = false;
          this.isVideoPreparing = false;
          this.cdr.markForCheck();
        }
      });
  }

  private ensureActiveVideoSource(video: HTMLVideoElement): void {
    const slide = this.activeSlide;
    if (this.loadedVideoSource === slide.video) {
      return;
    }

    this.loadedVideoSource = slide.video;
    video.src = slide.video;
    if (slide.poster) {
      video.poster = slide.poster;
    } else {
      video.removeAttribute('poster');
    }
    video.load();
  }

  private pauseVideo(resetToStart = true): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.pause();
    this.isVideoPlaying = false;
    this.isVideoPreparing = false;

    if (resetToStart) {
      try {
        video.currentTime = 0;
      } catch {
        // Some mobile browsers block seeking before metadata is ready.
      }
    }

    this.cdr.markForCheck();
  }

}
