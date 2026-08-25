import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { GtmService } from '../../../../../services/gtm.service';
import { environment } from 'src/environments/environment';
// Type-only: erased at build time so hls.js stays out of the eager bundle.
import type HlsJs from 'hls.js';

@Component({
  selector: 'app-video-hero-section',
  templateUrl: './video-hero-section.component.html',
  styleUrls: ['./video-hero-section.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('800ms {{delay}}ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { params: { delay: 0 } })
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('800ms 400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class VideoHeroSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  isPlaying = false;
  showControls = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  isFullscreen = false;
  progress = 0;
  isIOS = false;

  readonly posterUrl = environment.video.challengeIntroPoster;

  /** Shown when playback cannot be recovered, so the user is never left staring at a frozen frame. */
  hasFatalError = false;

  private readonly hlsSource = environment.video.challengeIntroHls;
  private hls: HlsJs | null = null;
  private networkRecoveries = 0;
  private mediaRecoveries = 0;
  private playbackSetup: Promise<void> = Promise.resolve();

  private leadKey: string | null = null;
  private hasTrackedPlay = false;
  private hasTrackedComplete = false;
  private controlsTimeout: any;
  private detachListeners: Array<() => void> = [];

  constructor(
    private route: ActivatedRoute,
    private gtm: GtmService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    this.route.queryParams.subscribe(params => {
      this.leadKey = params['lead'] || null;
    });
  }

  ngAfterViewInit(): void {
    const video = this.videoPlayer.nativeElement;

    video.volume = this.volume;
    video.muted = false;
    this.isMuted = false;

    this.attachMediaListeners(video);
    const onFullscreenChange = () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.changeDetectorRef.detectChanges();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    this.detachListeners.push(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
    this.playbackSetup = this.setupPlayback(video);
  }

  ngOnDestroy(): void {
    this.detachListeners.forEach(off => off());
    this.detachListeners = [];

    if (this.controlsTimeout) clearTimeout(this.controlsTimeout);

    // Without this the hls.js worker, its buffers and its network loaders leak on navigation.
    this.hls?.destroy();
    this.hls = null;
  }

  // -------------------------------
  //        H L S   L O A D E R
  // -------------------------------

  private async setupPlayback(video: HTMLVideoElement): Promise<void> {
    // iOS plays HLS natively and has no MSE, so skip downloading hls.js entirely there.
    if (this.isIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.hlsSource;
      return;
    }

    let Hls: typeof HlsJs;
    try {
      Hls = (await import('hls.js')).default;
    } catch {
      // Chunk failed to load (offline, blocked). Fall back to native if the browser can.
      if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = this.hlsSource;
      else this.reportFatal();
      return;
    }

    if (!Hls.isSupported()) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = this.hlsSource;
      else this.reportFatal();
      return;
    }

    // Built outside Angular: hls.js fires hundreds of internal events per minute and
    // every one of them would otherwise trigger a change-detection pass.
    this.ngZone.runOutsideAngular(() => {
      const hls = new Hls({
        // Never fetch a rendition larger than the rendered box (~804x452 here, more in
        // fullscreen). This is what keeps mid-range phones from decoding 1080p needlessly.
        capLevelToPlayerSize: true,
        startLevel: -1,
        // Assume ~1.5 Mbps before the first real measurement so the opening seconds are
        // not stuck on the 360p rendition.
        abrEwmaDefaultEstimate: 1_500_000,
        // Buffer enough for an instant start without pre-downloading the whole video
        // for visitors who never press play.
        maxBufferLength: 20,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        // Release already-played segments; unbounded back-buffer is a common mobile OOM crash.
        backBufferLength: 30,
        // Ride out flaky mobile connections instead of dying on the first failed segment.
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 500,
        lowLatencyMode: false
      });

      this.hls = hls;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (this.networkRecoveries++ < 3) {
              hls.startLoad();
            } else {
              this.reportFatal();
            }
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            if (this.mediaRecoveries === 0) {
              this.mediaRecoveries++;
              hls.recoverMediaError();
            } else if (this.mediaRecoveries === 1) {
              this.mediaRecoveries++;
              hls.swapAudioCodec();
              hls.recoverMediaError();
            } else {
              this.reportFatal();
            }
            break;

          default:
            this.reportFatal();
        }
      });

      // A clean fragment proves the connection healed, so allow the full retry budget again.
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        this.networkRecoveries = 0;
        this.mediaRecoveries = 0;
      });

      hls.loadSource(this.hlsSource);
      hls.attachMedia(video);
    });
  }

  private reportFatal(): void {
    this.hls?.destroy();
    this.hls = null;
    this.ngZone.run(() => {
      this.hasFatalError = true;
      this.isPlaying = false;
      this.changeDetectorRef.detectChanges();
    });
  }

  /** Manual retry from the error overlay. */
  retryPlayback(): void {
    this.hasFatalError = false;
    this.networkRecoveries = 0;
    this.mediaRecoveries = 0;
    this.playbackSetup = this.setupPlayback(this.videoPlayer.nativeElement);
  }

  // -------------------------------
  //         MEDIA LISTENERS
  // -------------------------------

  private attachMediaListeners(video: HTMLVideoElement): void {
    // timeupdate fires 4-60x/second. Inside the zone that is a full change-detection
    // pass each time, which is a real source of jank on this page.
    this.ngZone.runOutsideAngular(() => {
      const on = (type: string, handler: EventListener) => {
        video.addEventListener(type, handler);
        this.detachListeners.push(() => video.removeEventListener(type, handler));
      };

      on('loadedmetadata', () => {
        this.duration = video.duration;
        this.changeDetectorRef.detectChanges();
      });

      let lastRenderedSecond = -1;
      on('timeupdate', () => {
        this.currentTime = video.currentTime;
        this.progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;

        if (this.progress >= 95 && !this.hasTrackedComplete) {
          this.gtm.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
          this.hasTrackedComplete = true;
        }

        // Repaint at most once per second — the progress bar and the timer are the only
        // things bound to this, and neither needs sub-second precision.
        const second = Math.floor(video.currentTime);
        if (second !== lastRenderedSecond) {
          lastRenderedSecond = second;
          this.changeDetectorRef.detectChanges();
        }
      });

      on('ended', () => {
        this.isPlaying = false;
        this.showControls = false;

        if (!this.hasTrackedComplete) {
          this.gtm.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
          this.hasTrackedComplete = true;
        }
        this.changeDetectorRef.detectChanges();
      });

    });
  }

  async togglePlay(): Promise<void> {
    const video = this.videoPlayer.nativeElement;

    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      // A quick mobile tap can happen before the lazy hls.js chunk has attached its
      // MediaSource. Waiting here prevents play() from failing silently.
      await this.playbackSetup;
      await video.play();
    } catch {
      this.isPlaying = false;
      this.showControls = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  onVideoClick(): void {
    const isTouchOnly = window.matchMedia('(hover: none)').matches;
    if (isTouchOnly && this.isPlaying && !this.showControls) {
      this.showControls = true;
      this.resetControlsTimeout();
      return;
    }

    void this.togglePlay();
  }

  seek(event: MouseEvent): void {
    const video = this.videoPlayer.nativeElement;
    if (!video.duration) return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const pos = (rect.right - event.clientX) / rect.width;
    video.currentTime = Math.min(Math.max(pos, 0), 1) * video.duration;
  }

  toggleMute(): void {
    const video = this.videoPlayer.nativeElement;
    video.muted = !video.muted;
    this.isMuted = video.muted;
  }

  changeVolume(event: Event): void {
    const video = this.videoPlayer.nativeElement;
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    video.volume = value;
    this.volume = value;
    this.isMuted = value === 0;
  }

  async toggleFullscreen(): Promise<void> {
    const container = this.videoPlayer.nativeElement.parentElement;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Some mobile browsers only support fullscreen directly on the video element.
      const mobileVideo = this.videoPlayer.nativeElement as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      mobileVideo.webkitEnterFullscreen?.();
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onTouchControls(event: TouchEvent): void {
    this.showControls = true;
    if (this.isPlaying) this.resetControlsTimeout();
  }

  onClickControls(event: MouseEvent): void {
    event.stopPropagation();
  }

  private resetControlsTimeout(): void {
    if (this.controlsTimeout) clearTimeout(this.controlsTimeout);

    this.controlsTimeout = setTimeout(() => {
      if (this.isPlaying) this.showControls = false;
    }, 3000);
  }

  onVideoLoaded(): void {
    const video = this.videoPlayer.nativeElement;
    video.volume = this.volume;
  }

  onVideoCanPlay(): void {
    this.hasFatalError = false;
  }

  onVideoPlay(): void {
    this.isPlaying = true;
    this.showControls = true;
    this.resetControlsTimeout();
    if (!this.hasTrackedPlay) {
      this.gtm.trackVideoPlay('challenge_intro_video', this.leadKey || undefined);
      this.hasTrackedPlay = true;
    }
  }

  onVideoPause(): void {
    this.isPlaying = false;
    this.showControls = false;
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    // With hls.js attached, MEDIA_ERR_DECODE / SRC_NOT_SUPPORTED are handled by its own
    // recovery path. Only surface the overlay when nothing is left to recover with.
    if (!this.hls && video.error) {
      this.reportFatal();
    }
  }
}
