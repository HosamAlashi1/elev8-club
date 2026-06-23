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
  showNativeVideoControls = false;
  transitionDirection: SlideDirection = 'next';

  private animationTimer?: ReturnType<typeof setTimeout>;
  private warmupTimer?: ReturnType<typeof setTimeout>;
  private playbackFallbackTimer?: ReturnType<typeof setTimeout>;
  private pendingPlayToken = 0;
  private loadedVideoSource = '';
  private readonly proofAvatars = [
    'assets/images/anima-home/proof-avatar-1.webp',
    'assets/images/anima-home/proof-avatar-2.webp',
    'assets/images/anima-home/proof-avatar-3.webp',
  ] as const;
  readonly slides: ProofSlide[] = [
    {
      name: 'أنصار من فلسطين 🇵🇸',
      country: 'PS',
      role: 'كانت تشتغل بمجال التسويق',
      amount: '+1,000$',
      video: 'assets/videos/testimonials/ansar-palestine.mp4',
      poster: 'assets/images/anima-home/proof-frame-ansar.webp',
      summary: 'وخلال 6 أيام فقط قدرت تحقق +1,000$ لدرجة إنها قررت تترك شغلها بالكامل وتكمل بالتداول.',
    },
    {
      name: 'فادي من سوريا 🇸🇾',
      country: 'SY',
      role: 'طالب IT ولسه بيدرس وحاول يعمل دخل إضافي بس ما قدر ولما بلش معنا',
      amount: '1,500$',
      video: 'assets/videos/testimonials/fadi-syria.mp4',
      poster: 'assets/images/anima-home/proof-frame-fadi.webp',
      summary: 'خلال 8 أيام عمل 1,500$ جنب دراسته.',
    },
    {
      name: 'هيثم من سوريا 🇸🇾',
      country: 'SY',
      role: 'موظف وعنده شغل أساسي وكان يبحث عن دخل إضافي يساعده',
      amount: '1,075$',
      video: 'assets/videos/testimonials/haitham-turkey.mp4',
      poster: 'assets/images/anima-home/proof-frame-haitham.webp',
      summary: 'ولما بلش معنا قدر خلال ساعتين فقط يحقق 1,075$.',
    },
    {
      name: 'أبو بكر من ليبيا 🇱🇾',
      country: 'LY',
      role: 'فني صيانة جوالات اغلب يومه بالشغل',
      amount: '384$',
      video: 'assets/videos/testimonials/abubakr-libya.mp4',
      poster: 'assets/images/anima-home/proof-frame-abubakr.webp',
      summary: 'من أول يوم معنا حقق معنا 384$.',
    },
    {
      name: 'لويس من لبنان 🇱🇧',
      country: 'LB',
      role: 'يشتغل كوافير نسائي ومحتاج دخل إضافي',
      amount: '1,500$',
      video: 'assets/videos/testimonials/louis-lebanon.mp4',
      poster: 'assets/images/anima-home/proof-frame-louis.webp',
      summary: 'وخلال 8 أيام ونصف وصل لـ 1,500$.',
    },
    {
      name: 'أمل من المغرب 🇲🇦',
      country: 'MA',
      role: 'عندها بزنس خاص وعندها وقت إضافي قررت تستغل',
      amount: '1,009$',
      video: 'assets/videos/testimonials/amal-morocco.mp4',
      poster: 'assets/images/anima-home/proof-frame-amal.webp',
      summary: 'وخلال 5 أيام ونصف حققت 1,009$.',
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
    if (this.warmupTimer) {
      clearTimeout(this.warmupTimer);
    }
    this.clearPlaybackFallbackTimer();
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

  onPlayButtonPress(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleVideo();
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
    this.showNativeVideoControls = false;
    this.transitionDirection = direction;
    this.activeIndex = (index + this.slides.length) % this.slides.length;
    this.isAnimating = true;
    this.cdr.markForCheck();

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    if (this.warmupTimer) {
      clearTimeout(this.warmupTimer);
    }

    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
      this.cdr.markForCheck();
    }, 520);

    this.warmupTimer = setTimeout(() => {
      this.warmActiveVideo();
    }, 580);
  }

  private setupVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = false;
    video.volume = 1;
    video.preload = 'metadata';
    video.playsInline = true;
    video.controls = false;
    video.onended = () => {
      this.isVideoPlaying = false;
      this.isVideoPreparing = false;
      this.showNativeVideoControls = false;
      video.controls = false;
      video.currentTime = 0;
      this.cdr.markForCheck();
    };
    this.warmActiveVideo();
  }

  onVideoWaiting(): void {
    if (!this.isVideoPlaying && !this.isVideoPreparing) {
      return;
    }

    this.isVideoPreparing = true;
    this.cdr.markForCheck();
  }

  onVideoPlaying(): void {
    this.isVideoPlaying = true;
    this.isVideoPreparing = false;
    this.clearPlaybackFallbackTimer();
    this.cdr.markForCheck();
  }

  onVideoCanPlay(): void {
    if (!this.isVideoPreparing) {
      return;
    }

    this.cdr.markForCheck();
  }

  onVideoError(): void {
    this.isVideoPlaying = false;
    this.isVideoPreparing = false;
    this.showNativeVideoControls = false;
    this.loadedVideoSource = '';
    this.clearPlaybackFallbackTimer();
    this.cdr.markForCheck();
  }

  onVideoPaused(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video || video.ended || this.isVideoPreparing) {
      return;
    }

    this.isVideoPlaying = false;
    this.clearPlaybackFallbackTimer();
    this.cdr.markForCheck();
  }

  private playActiveVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    const token = ++this.pendingPlayToken;
    const shouldUseNativeControls = this.isTouchPlaybackDevice();
    this.isVideoPreparing = true;
    this.showNativeVideoControls = false;
    video.controls = false;
    this.cdr.markForCheck();
    this.ensureActiveVideoSource(video, true);

    this.clearPlaybackFallbackTimer();
    this.playbackFallbackTimer = setTimeout(() => {
      if (token === this.pendingPlayToken && this.isVideoPreparing && shouldUseNativeControls) {
        this.revealNativePlaybackControls(video);
      }
    }, 1400);

    video.play()
      .then(() => {
        if (token !== this.pendingPlayToken) {
          video.pause();
          return;
        }

        this.isVideoPlaying = true;
        this.isVideoPreparing = false;
        this.clearPlaybackFallbackTimer();
        this.cdr.markForCheck();
      })
      .catch(() => {
        if (token === this.pendingPlayToken) {
          if (shouldUseNativeControls) {
            this.revealNativePlaybackControls(video);
          } else {
            this.isVideoPlaying = false;
            this.isVideoPreparing = false;
            this.clearPlaybackFallbackTimer();
            this.cdr.markForCheck();
          }
        }
      });
  }

  private ensureActiveVideoSource(video: HTMLVideoElement, forceLoad = false): void {
    const slide = this.activeSlide;
    if (this.loadedVideoSource === slide.video && !forceLoad) {
      return;
    }

    const sourceChanged = this.loadedVideoSource !== slide.video || video.getAttribute('src') !== slide.video;
    this.loadedVideoSource = slide.video;
    if (sourceChanged) {
      video.src = slide.video;
    }
    if (slide.poster) {
      video.poster = slide.poster;
    } else {
      video.removeAttribute('poster');
    }
    if (sourceChanged || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.load();
    }
  }

  private warmActiveVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video || this.isVideoPlaying || this.isVideoPreparing) {
      return;
    }

    this.ensureActiveVideoSource(video);
  }

  private pauseVideo(resetToStart = true): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.pause();
    this.isVideoPlaying = false;
    this.isVideoPreparing = false;
    this.showNativeVideoControls = false;
    video.controls = false;
    this.clearPlaybackFallbackTimer();

    if (resetToStart) {
      try {
        video.currentTime = 0;
      } catch {
        // Some mobile browsers block seeking before metadata is ready.
      }
    }

    this.cdr.markForCheck();
  }

  private revealNativePlaybackControls(video: HTMLVideoElement): void {
    video.controls = true;
    this.showNativeVideoControls = true;
    this.isVideoPreparing = false;
    this.cdr.markForCheck();
  }

  private clearPlaybackFallbackTimer(): void {
    if (this.playbackFallbackTimer) {
      clearTimeout(this.playbackFallbackTimer);
      this.playbackFallbackTimer = undefined;
    }
  }

  private isTouchPlaybackDevice(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

}
