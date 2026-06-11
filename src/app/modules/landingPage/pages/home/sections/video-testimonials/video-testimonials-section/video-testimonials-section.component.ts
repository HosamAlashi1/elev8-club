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
  private videoPrimeTimer?: ReturnType<typeof setTimeout>;
  private pendingPlayToken = 0;
  private loadedVideoSource = '';
  private readonly posterRequests = new Set<number>();
  private readonly posterAttempts = new Map<number, number>();
  private readonly posterUrls: string[] = [];
  private isDestroyed = false;

  readonly slides: ProofSlide[] = [
    {
      name: 'أمل من المغرب',
      country: 'MA',
      role: 'عندها بزنس خاص...',
      amount: '$1,009',
      video: 'assets/videos/testimonials/amal-morocco.mov',
      avatar: 'assets/images/anima-home/proof-person-3.png',
      summary: 'وخلال 5 أيام ونصف حققت $1,009.',
    },
    {
      name: 'لويس من لبنان',
      country: 'LB',
      role: 'يشتغل كوافير نسائي...',
      amount: '$1,500',
      video: 'assets/videos/testimonials/louis-lebanon.mov',
      avatar: 'assets/images/anima-home/proof-person-2.png',
      summary: 'وخلال 8 أيام ونصف وصل لـ $1,500.',
    },
    {
      name: 'أنصار من فلسطين',
      country: 'PS',
      role: 'كانت تشتغل بالمجال التسويقي...',
      amount: '+$1,000',
      video: 'assets/videos/testimonials/ansar-palestine.mov',
      avatar: 'assets/images/anima-home/proof-person-2.png',
      summary: 'وخلال 6 أيام فقط قدرت تحقق +$1,000 لدرجة إنها قررت تترك شغلها بالكامل وتكمل بالتداول.',
    },
    {
      name: 'فادي من سوريا',
      country: 'SY',
      role: 'طالب IT ولسه بيدرس...',
      amount: '$1,500',
      video: 'assets/videos/testimonials/fadi-syria.mp4',
      avatar: 'assets/images/anima-home/proof-person-2.png',
      summary: 'خلال 8 أيام عمل $1,500 جنب دراسته.',
    },
    {
      name: 'أبو بكر من ليبيا',
      country: 'LY',
      role: 'في صيانة جوالات...',
      amount: '$384',
      video: 'assets/videos/testimonials/abubakr-libya.mov',
      avatar: 'assets/images/anima-home/proof-person-1.png',
      summary: 'من أول يوم معنا حقق $384.',
    },
    {
      name: 'هيثم من تركيا',
      country: 'TR',
      role: 'موظف وعنده شغل أساسي...',
      amount: '$1,075',
      video: 'assets/videos/testimonials/haitham-turkey.mp4',
      avatar: 'assets/images/anima-home/proof-person-3.png',
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
    return [
      'assets/images/anima-home/proof-avatar-1.svg',
      'assets/images/anima-home/proof-avatar-2.svg',
      'assets/images/anima-home/proof-avatar-3.svg',
    ];
  }

  ngAfterViewInit(): void {
    this.setupVideo();
    this.requestPosterForIndex(this.activeIndex);
    this.schedulePosterQueue();
    this.scheduleVideoPrime(220);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.pauseVideo(false);
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    if (this.videoPrimeTimer) {
      clearTimeout(this.videoPrimeTimer);
    }
    this.posterUrls.forEach((url) => URL.revokeObjectURL(url));
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
    this.requestPosterForIndex(this.activeIndex);

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }

    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
      this.scheduleVideoPrime(80);
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
    video.preload = 'metadata';
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

  private scheduleVideoPrime(delay = 160): void {
    if (this.videoPrimeTimer) {
      clearTimeout(this.videoPrimeTimer);
    }

    this.videoPrimeTimer = setTimeout(() => {
      if (this.isDestroyed || this.isVideoPlaying || this.isVideoPreparing) {
        return;
      }

      const video = this.proofVideo?.nativeElement;
      if (!video) {
        return;
      }

      this.ensureActiveVideoSource(video);
    }, delay);
  }

  private schedulePosterQueue(): void {
    const orderedIndexes = [
      this.activeIndex,
      ...this.slides.map((_, index) => index).filter((index) => index !== this.activeIndex),
    ];

    let cursor = 0;
    const loadNext = () => {
      if (this.isDestroyed || cursor >= orderedIndexes.length) {
        return;
      }

      const index = orderedIndexes[cursor++];
      this.requestPosterForIndex(index)
        .finally(() => setTimeout(loadNext, 90));
    };

    setTimeout(loadNext, 120);
  }

  private requestPosterForIndex(index: number): Promise<void> {
    const slide = this.slides[index];
    if (!slide || slide.poster || this.posterRequests.has(index)) {
      return Promise.resolve();
    }

    const attempts = this.posterAttempts.get(index) || 0;
    if (attempts >= 3) {
      return Promise.resolve();
    }

    this.posterAttempts.set(index, attempts + 1);
    this.posterRequests.add(index);
    return this.capturePoster(slide)
      .then((poster) => {
        if (!poster || this.isDestroyed) {
          if (!this.isDestroyed && !slide.poster) {
            setTimeout(() => this.requestPosterForIndex(index), 600);
          }
          return;
        }

        slide.poster = poster;
        this.cdr.markForCheck();
      })
      .catch(() => {
        if (!this.isDestroyed && !slide.poster) {
          setTimeout(() => this.requestPosterForIndex(index), 600);
        }
      })
      .finally(() => {
        this.posterRequests.delete(index);
      });
  }

  private capturePoster(slide: ProofSlide): Promise<string | null> {
    if (typeof document === 'undefined') {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const candidateTimes = [0.35, 0.75, 1.25, 2, 3.5, 5];
      const timeout = setTimeout(() => finish(lastPoster), 8500);
      let isDone = false;
      let candidateIndex = 0;
      let candidateTimer: ReturnType<typeof setTimeout> | undefined;
      let lastPoster: string | null = null;

      const finish = (poster: string | null) => {
        if (isDone) {
          return;
        }

        isDone = true;
        clearTimeout(timeout);
        if (candidateTimer) {
          clearTimeout(candidateTimer);
        }
        video.pause();
        video.removeAttribute('src');
        video.load();
        resolve(poster);
      };

      const draw = () => {
        if (isDone) {
          return;
        }

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        if (!sourceWidth || !sourceHeight) {
          tryNextCandidate();
          return;
        }

        canvas.width = 360;
        canvas.height = 612;
        const targetRatio = canvas.width / canvas.height;
        const sourceRatio = sourceWidth / sourceHeight;
        let sx = 0;
        let sy = 0;
        let sw = sourceWidth;
        let sh = sourceHeight;

        if (sourceRatio > targetRatio) {
          sw = sourceHeight * targetRatio;
          sx = (sourceWidth - sw) / 2;
        } else {
          sh = sourceWidth / targetRatio;
          sy = (sourceHeight - sh) / 2;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          tryNextCandidate();
          return;
        }

        context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        lastPoster = dataUrl;

        if (!this.isUsablePosterFrame(context, canvas.width, canvas.height)) {
          tryNextCandidate();
          return;
        }

        finish(dataUrl);
      };

      const tryNextCandidate = () => {
        if (isDone) {
          return;
        }

        if (candidateTimer) {
          clearTimeout(candidateTimer);
        }

        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6;
        if (candidateIndex >= candidateTimes.length) {
          finish(lastPoster);
          return;
        }

        const requestedTime = Math.min(candidateTimes[candidateIndex++], Math.max(0, duration - 0.15));

        const drawIfReady = () => {
          if (!isDone && Math.abs(video.currentTime - requestedTime) < 0.32 && video.readyState >= 2) {
            draw();
          }
        };

        const onSeeked = () => {
          if (candidateTimer) {
            clearTimeout(candidateTimer);
          }
          draw();
        };

        video.addEventListener('seeked', onSeeked, { once: true });

        try {
          video.currentTime = requestedTime;
        } catch {
          video.removeEventListener('seeked', onSeeked);
          drawIfReady();
          return;
        }

        candidateTimer = setTimeout(() => {
          video.removeEventListener('seeked', onSeeked);
          drawIfReady();
          if (!isDone) {
            tryNextCandidate();
          }
        }, 900);
      };

      video.muted = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.src = slide.video;
      video.addEventListener('loadedmetadata', () => {
        tryNextCandidate();
      }, { once: true });
      video.addEventListener('error', () => finish(null), { once: true });
      video.load();
    });
  }

  private isUsablePosterFrame(context: CanvasRenderingContext2D, width: number, height: number): boolean {
    const sampleWidth = Math.min(72, width);
    const sampleHeight = Math.min(122, height);
    const image = context.getImageData(
      Math.floor((width - sampleWidth) / 2),
      Math.floor((height - sampleHeight) / 2),
      sampleWidth,
      sampleHeight
    );
    const data = image.data;
    let luminanceSum = 0;
    let brightPixels = 0;
    let variedPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      luminanceSum += luminance;

      if (luminance > 36) {
        brightPixels++;
      }

      if (Math.max(r, g, b) - Math.min(r, g, b) > 18) {
        variedPixels++;
      }
    }

    const pixels = data.length / 4;
    const average = luminanceSum / pixels;
    return average > 16 && (brightPixels / pixels > 0.025 || variedPixels / pixels > 0.06);
  }
}
