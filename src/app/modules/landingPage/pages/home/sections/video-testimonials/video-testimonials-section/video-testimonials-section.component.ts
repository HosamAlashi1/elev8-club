import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import Hls from 'hls.js';

interface ProofSlide {
  name: string;
  country: string;
  role: string;
  amount: string;
  video: string;
  frame: string;
  frameTime: number;
  avatar: string;
  summary: string;
}

type SlideDirection = 'next' | 'prev';

@Component({
  selector: 'app-video-testimonials-section',
  templateUrl: './video-testimonials-section.component.html',
  styleUrls: ['./video-testimonials-section.component.css']
})
export class VideoTestimonialsSectionComponent implements AfterViewInit, OnDestroy {
  @Input() onOpenRegistration?: () => void;
  @ViewChild('proofVideo') proofVideo?: ElementRef<HTMLVideoElement>;

  activeIndex = 0;
  isAnimating = false;
  isVideoPlaying = false;
  isVideoPreparing = false;
  transitionDirection: SlideDirection = 'next';

  readonly hlsSource = 'assets/videos/hls_here_1/here_1.m3u8';
  private hls?: Hls;
  private animationTimer?: ReturnType<typeof setTimeout>;
  private videoSetupTimer?: ReturnType<typeof setTimeout>;
  private warmupTimer?: ReturnType<typeof setTimeout>;
  private pendingPlayToken = 0;
  private warmupToken = 0;
  private loadedVideoSource = '';
  private activeVideoReadyKey = '';
  private hlsMediaAttached = false;
  private readonly preloadedFrames: HTMLImageElement[] = [];

  readonly slides: ProofSlide[] = [
    {
      name: 'أنصار من فلسطين',
      country: 'PS',
      role: 'كانت تشتغل بالمجال التسويقي...',
      amount: '+$1,000',
      video: this.hlsSource,
      frame: 'assets/images/anima-home/proof-frame-ansar.jpg',
      frameTime: 0.8,
      avatar: 'assets/images/anima-home/proof-person-2.png',
      summary: 'وخلال 6 أيام فقط قدرت تحقق +$1,000 للدرجة إنها قررت تترك شغلها بالكامل وتكمل بالتداول.'
    },
    {
      name: 'فادي من سوريا',
      country: 'SY',
      role: 'طالب IT ولسه بيدرس...',
      amount: '$1,500',
      video: this.hlsSource,
      frame: 'assets/images/anima-home/proof-frame-fadi.jpg',
      frameTime: 18.5,
      avatar: 'assets/images/anima-home/proof-person-2.png',
      summary: 'وخلال 8 أيام عمل $1,500 جنب دراسته.'
    },
    {
      name: 'هيثم من سوريا',
      country: 'SY',
      role: 'موظف وعنده شغل أساسي...',
      amount: '$1,075',
      video: this.hlsSource,
      frame: 'assets/images/anima-home/proof-frame-haitham.jpg',
      frameTime: 28.5,
      avatar: 'assets/images/anima-home/proof-person-3.png',
      summary: 'وخلال ساعتين فقط حقق $1,075.'
    },
    {
      name: 'أبو بكر من ليبيا',
      country: 'LY',
      role: 'في صيانة جوالات...',
      amount: '$384',
      video: this.hlsSource,
      frame: 'assets/images/anima-home/proof-frame-abubakr.jpg',
      frameTime: 38.5,
      avatar: 'assets/images/anima-home/proof-person-1.png',
      summary: 'في أول يوم معنا حقق $384.'
    },
    {
      name: 'لويس من لبنان',
      country: 'LB',
      role: 'يشتغل كوافير نسائي...',
      amount: '$1,500',
      video: this.hlsSource,
      frame: 'assets/images/anima-home/proof-frame-louis.jpg',
      frameTime: 52.5,
      avatar: 'assets/images/anima-home/proof-person-2.png',
      summary: 'وخلال 8 أيام ونصف وصل لـ $1,500.'
    },
    {
      name: 'أمل من المغرب',
      country: 'MA',
      role: 'عندها بزنس خاص...',
      amount: '$1,009',
      video: this.hlsSource,
      frame: 'assets/images/anima-home/proof-frame-amal.jpg',
      frameTime: 66.5,
      avatar: 'assets/images/anima-home/proof-person-3.png',
      summary: 'وخلال 5 أيام ونصف حققت $1,009.'
    }
  ];

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
      'assets/images/anima-home/proof-avatar-3.svg'
    ];
  }

  ngAfterViewInit(): void {
    this.preloadFrameImages();
    this.videoSetupTimer = setTimeout(() => {
      this.setupHls();
      this.scheduleVideoWarmup(180);
    });
  }

  ngOnDestroy(): void {
    this.pauseVideo(false);
    this.hls?.destroy();
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    if (this.videoSetupTimer) {
      clearTimeout(this.videoSetupTimer);
    }
    if (this.warmupTimer) {
      clearTimeout(this.warmupTimer);
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
    this.activeVideoReadyKey = '';
    this.transitionDirection = direction;
    this.activeIndex = (index + this.slides.length) % this.slides.length;
    this.isAnimating = true;

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }

    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
      this.scheduleVideoWarmup(120);
    }, 520);
  }

  private preloadFrameImages(): void {
    this.slides.forEach((slide) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = slide.frame;
      image.decode?.().catch(() => undefined);
      this.preloadedFrames.push(image);
    });
  }

  private setupHls(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = false;
    video.volume = 1;
    video.preload = 'auto';
    video.playsInline = true;
    video.onended = () => {
      this.isVideoPlaying = false;
      this.activeVideoReadyKey = '';
      this.seekVideoFrame(video, this.activeSlide.frameTime);
      this.scheduleVideoWarmup(120);
    };

    if (Hls.isSupported() && !this.hls) {
      this.hls = new Hls({
        autoStartLoad: false,
        maxBufferLength: 18,
        maxMaxBufferLength: 30,
        backBufferLength: 10
      });
      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.hlsMediaAttached = true;
        this.scheduleVideoWarmup(80);
      });
      this.hls.attachMedia(video);
    }
  }

  private playActiveVideo(): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    const token = ++this.pendingPlayToken;

    if (this.isActiveVideoReady()) {
      this.startPreparedVideo(video, token);
      return;
    }

    this.isVideoPreparing = true;
    this.prepareActiveVideo(() => {
      if (token !== this.pendingPlayToken) {
        return;
      }

      this.startPreparedVideo(video, token);
    });
  }

  private prepareActiveVideo(onReady: () => void): void {
    const video = this.proofVideo?.nativeElement;
    const slide = this.activeSlide;
    if (!video || !slide) {
      onReady();
      return;
    }

    this.setupHls();
    const videoKey = this.getVideoKey(slide);

    if (this.isActiveVideoReady()) {
      onReady();
      return;
    }

    const markReady = () => {
      if (this.getVideoKey(this.activeSlide) !== videoKey) {
        return;
      }

      this.activeVideoReadyKey = videoKey;
      onReady();
    };

    if (Hls.isSupported()) {
      const hls = this.hls;
      if (!hls) {
        onReady();
        return;
      }

      const seekAndPlay = () => {
        hls.startLoad(slide.frameTime);
        this.seekVideoFrame(video, slide.frameTime, markReady);
      };

      this.whenHlsMediaAttached(hls, () => {
        if (this.loadedVideoSource !== slide.video) {
          this.loadedVideoSource = slide.video;
          this.activeVideoReadyKey = '';
          const onManifestParsed = () => {
            hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
            seekAndPlay();
          };
          hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
          hls.loadSource(slide.video);
          return;
        }

        seekAndPlay();
      });
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (this.loadedVideoSource !== slide.video) {
        this.loadedVideoSource = slide.video;
        this.activeVideoReadyKey = '';
        video.src = slide.video;
        video.load();
      }
      this.seekVideoFrame(video, slide.frameTime, markReady);
      return;
    }

    markReady();
  }

  private pauseVideo(seekToActiveFrame = true): void {
    const video = this.proofVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.pause();
    this.isVideoPlaying = false;
    this.isVideoPreparing = false;

    if (seekToActiveFrame) {
      this.seekVideoFrame(video, this.activeSlide.frameTime);
    }
  }

  private startPreparedVideo(video: HTMLVideoElement, token: number): void {
    video.play()
      .then(() => {
        if (token !== this.pendingPlayToken) {
          video.pause();
          return;
        }

        this.isVideoPlaying = true;
        this.isVideoPreparing = false;
      })
      .catch(() => {
        if (token === this.pendingPlayToken) {
          this.isVideoPlaying = false;
          this.isVideoPreparing = false;
        }
      });
  }

  private scheduleVideoWarmup(delay = 260): void {
    if (this.warmupTimer) {
      clearTimeout(this.warmupTimer);
    }

    const token = ++this.warmupToken;
    this.warmupTimer = setTimeout(() => {
      if (token !== this.warmupToken || this.isVideoPlaying || this.isVideoPreparing) {
        return;
      }

      this.prepareActiveVideo(() => {
        const video = this.proofVideo?.nativeElement;
        if (!video || this.isVideoPlaying) {
          return;
        }

        video.pause();
      });
    }, delay);
  }

  private whenHlsMediaAttached(hls: Hls, callback: () => void): void {
    if (this.hlsMediaAttached) {
      callback();
      return;
    }

    const onMediaAttached = () => {
      hls.off(Hls.Events.MEDIA_ATTACHED, onMediaAttached);
      callback();
    };

    hls.on(Hls.Events.MEDIA_ATTACHED, onMediaAttached);
  }

  private isActiveVideoReady(): boolean {
    const video = this.proofVideo?.nativeElement;
    if (!video || this.activeVideoReadyKey !== this.getVideoKey(this.activeSlide)) {
      return false;
    }

    return video.readyState >= 2 && Math.abs(video.currentTime - this.activeSlide.frameTime) < 0.35;
  }

  private getVideoKey(slide: ProofSlide): string {
    return `${slide.video}#${slide.frameTime}`;
  }

  private seekVideoFrame(video: HTMLVideoElement, frameTime: number, onSettled?: () => void): void {
    let didSettle = false;
    const requestedFrame = String(frameTime);
    video.dataset['proofRequestedFrame'] = requestedFrame;

    const settle = () => {
      if (didSettle || video.dataset['proofRequestedFrame'] !== requestedFrame) {
        return;
      }

      didSettle = true;
      onSettled?.();
    };

    const seek = () => {
      if (video.dataset['proofRequestedFrame'] !== requestedFrame) {
        return;
      }

      const fallbackDuration = frameTime + 0.2;
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : fallbackDuration;
      const targetTime = Math.min(frameTime, Math.max(0, duration - 0.1));

      try {
        if (Math.abs(video.currentTime - targetTime) > 0.05) {
          video.currentTime = targetTime;
          return;
        }
      } catch {
        return;
      }

      settle();
    };

    if (video.readyState >= 1) {
      seek();
    }

    video.addEventListener('loadedmetadata', seek, { once: true });
    video.addEventListener('loadeddata', seek, { once: true });
    video.addEventListener('canplay', settle, { once: true });
    video.addEventListener('seeked', settle, { once: true });
  }
}
