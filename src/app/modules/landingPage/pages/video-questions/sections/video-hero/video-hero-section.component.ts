import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { GtmService } from '../../../../../services/gtm.service';
import { environment } from 'src/environments/environment';
// Type-only: erased at build time so hls.js stays out of the eager bundle.
import type HlsJs from 'hls.js';

/**
 * What the box is showing right now (the "VSL" flow the client asked for, modelled on Monetise):
 *  - loading : spinner until the first frame can play.
 *  - muted   : the video already runs silently behind a red "click to listen" box. The click is the
 *              signal that the visitor actually chose to watch (that is when the play is tracked),
 *              and it restarts the video from 0:00 with sound.
 *  - playing / paused : normal playback; the eased progress bar and the controls stay visible.
 *  - resume  : the visitor watched part of it, then left (another tab/app, or a reload) — a full
 *              cover asks "continue or start over?".
 *  - ended   : same cover after the end, offering to watch again.
 */
type PlayerState = 'loading' | 'muted' | 'playing' | 'paused' | 'resume' | 'ended';

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

  state: PlayerState = 'loading';
  /** Mid-playback stall (network); shows the spinner over the running video. */
  isBuffering = false;
  currentTime = 0;
  duration = 0;
  progress = 0;
  isIOS = false;

  readonly speeds = [1, 1.25, 1.5, 2];
  speed = 1;

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
  private hasStarted = false;
  private setupDone = false;
  private startTimer: any;
  private lastSavedSecond = -1;
  private detachListeners: Array<() => void> = [];

  /** Where this visitor left off, per video (a new video URL starts fresh). */
  private get storageKey(): string {
    return `elev8:vq-video:${this.hlsSource}`;
  }

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
    // Muted from the very first frame: browsers only allow autoplay without sound.
    video.muted = true;

    this.attachMediaListeners(video);
    this.attachPageListeners(video);
    this.playbackSetup = this.setupPlayback(video).then(() => { this.setupDone = true; });

    // iOS Safari ignores preload and often never fires canplay until the visitor taps, so the spinner
    // must not wait for it forever: any sign of life (or 2.5 s) moves on to the "tap to listen" box.
    this.startTimer = setTimeout(() => void this.onFirstPlayable(video), 2500);
  }

  ngOnDestroy(): void {
    clearTimeout(this.startTimer);
    this.saveProgress(true);
    this.detachListeners.forEach(off => off());
    this.detachListeners = [];

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
        // Buffer enough for an instant start without pre-downloading the whole video.
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
      this.isBuffering = false;
      this.changeDetectorRef.detectChanges();
    });
  }

  /** Manual retry from the error overlay. */
  retryPlayback(): void {
    this.hasFatalError = false;
    this.networkRecoveries = 0;
    this.mediaRecoveries = 0;
    this.hasStarted = false;
    this.state = 'loading';
    this.setupDone = false;
    this.playbackSetup = this.setupPlayback(this.videoPlayer.nativeElement).then(() => { this.setupDone = true; });
    this.startTimer = setTimeout(() => void this.onFirstPlayable(this.videoPlayer.nativeElement), 2500);
  }

  // -------------------------------
  //         START-UP FLOW
  // -------------------------------

  /** First moment the video can play: decide between resume cover, end cover, or silent autoplay. */
  private async onFirstPlayable(video: HTMLVideoElement): Promise<void> {
    if (this.hasStarted) return;
    this.hasStarted = true;

    const saved = this.readSavedPosition();
    const duration = video.duration || 0;

    if (saved !== null && duration && saved >= duration - 3) {
      this.setState('ended');
      return;
    }
    if (saved !== null && saved > 3) {
      video.currentTime = saved;
      this.setState('resume');
      return;
    }

    this.setState('muted');
    video.muted = true;
    try {
      await video.play();
    } catch {
      // Autoplay refused (e.g. iOS Low Power Mode). The red box still shows; tapping it starts
      // playback with sound, so nothing is lost.
    }
  }

  /** The red box: the visitor chose to listen — start over from 0:00 with sound. */
  async listen(): Promise<void> {
    const video = this.videoPlayer.nativeElement;
    video.currentTime = 0;
    await this.playWithSound();
    this.trackPlay('unmute');
  }

  /** Resume cover → carry on from where they left. */
  async continueWatching(): Promise<void> {
    await this.playWithSound();
    this.trackPlay('resume');
  }

  /** Resume / end cover → from the beginning. */
  async restart(): Promise<void> {
    const video = this.videoPlayer.nativeElement;
    video.currentTime = 0;
    this.hasTrackedComplete = false;
    await this.playWithSound();
    this.trackPlay('restart');
  }

  private async playWithSound(): Promise<void> {
    const video = this.videoPlayer.nativeElement;
    video.muted = false;
    video.playbackRate = this.speed;
    this.setState('playing');
    try {
      // iOS only honours play() made synchronously inside the tap, so skip the await once hls/native is ready.
      // (A very quick tap can still come before the lazy hls.js chunk has attached its MediaSource.)
      if (!this.setupDone) await this.playbackSetup;
      await video.play();
    } catch {
      this.setState('paused');
    }
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

      on('loadedmetadata', () => { if (!this.hasStarted) void this.onFirstPlayable(video); });
      on('loadeddata', () => { if (!this.hasStarted) void this.onFirstPlayable(video); });
      on('canplay', () => {
        this.hasFatalError = false;
        this.isBuffering = false;
        if (!this.hasStarted) void this.onFirstPlayable(video);
        else this.changeDetectorRef.detectChanges();
      });

      on('waiting', () => {
        if (this.state === 'playing' || this.state === 'muted') {
          this.isBuffering = true;
          this.changeDetectorRef.detectChanges();
        }
      });
      on('playing', () => {
        this.isBuffering = false;
        this.changeDetectorRef.detectChanges();
      });

      let lastRenderedSecond = -1;
      on('timeupdate', () => {
        this.currentTime = video.currentTime;
        this.progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;

        if (!video.muted && this.progress >= 95 && !this.hasTrackedComplete) {
          this.gtm.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
          this.hasTrackedComplete = true;
        }

        this.saveProgress();

        // Repaint at most once per second — the progress bar is the only thing bound to this.
        const second = Math.floor(video.currentTime);
        if (second !== lastRenderedSecond) {
          lastRenderedSecond = second;
          this.changeDetectorRef.detectChanges();
        }
      });

      on('pause', () => {
        if (this.state === 'playing') this.setState('paused');
      });

      on('ended', () => {
        if (video.muted) {
          // The silent preview ran out before anyone tapped it: loop it quietly.
          video.currentTime = 0;
          void video.play().catch(() => undefined);
          return;
        }
        if (!this.hasTrackedComplete) {
          this.gtm.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
          this.hasTrackedComplete = true;
        }
        this.saveProgress(true);
        this.setState('ended');
      });
    });
  }

  /** Leaving the page/app mid-video pauses it; coming back shows the "continue or restart" cover. */
  private attachPageListeners(video: HTMLVideoElement): void {
    const onVisibility = () => {
      if (document.hidden) {
        if (this.state === 'playing' || this.state === 'paused') {
          video.pause();
          this.saveProgress(true);
          this.setState('resume');
        }
      }
    };
    const onPageHide = () => this.saveProgress(true);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    this.detachListeners.push(() => document.removeEventListener('visibilitychange', onVisibility));
    this.detachListeners.push(() => window.removeEventListener('pagehide', onPageHide));
  }

  // -------------------------------
  //            CONTROLS
  // -------------------------------

  togglePlay(): void {
    const video = this.videoPlayer.nativeElement;
    if (this.state === 'muted') {
      void this.listen();
      return;
    }
    if (this.state === 'playing') {
      video.pause();
      return;
    }
    if (this.state === 'paused') void this.playWithSound();
  }

  /** Tapping the picture: in the silent preview it means "let me hear it", otherwise play/pause. */
  onVideoClick(): void {
    this.togglePlay();
  }

  cycleSpeed(): void {
    const next = this.speeds[(this.speeds.indexOf(this.speed) + 1) % this.speeds.length];
    this.speed = next;
    this.videoPlayer.nativeElement.playbackRate = next;
  }

  formatSpeed(value: number): string {
    return `${value}x`;
  }

  /** Eased fill (same curve as the v2 page): races ahead early, crawls near the end, hits 100 with the video. */
  private static readonly EASE_POWER = 6;

  get displayProgress(): number {
    // The silent preview is not "watching" yet — keep the bar at the start until they tap to listen.
    if (this.state === 'muted' || this.state === 'loading') return 0;
    if (this.state === 'ended') return 100;
    if (!this.duration) return this.progress;
    const t = Math.min(1, Math.max(0, this.currentTime / this.duration));
    return (1 - Math.pow(1 - t, VideoHeroSectionComponent.EASE_POWER)) * 100;
  }

  get showCover(): boolean {
    return this.state === 'resume' || this.state === 'ended';
  }

  get showSpinner(): boolean {
    return !this.hasFatalError && (this.state === 'loading' || this.isBuffering);
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    // With hls.js attached, MEDIA_ERR_DECODE / SRC_NOT_SUPPORTED are handled by its own
    // recovery path. Only surface the overlay when nothing is left to recover with.
    if (!this.hls && video.error) {
      this.reportFatal();
    }
  }

  // -------------------------------
  //            HELPERS
  // -------------------------------

  private setState(next: PlayerState): void {
    this.ngZone.run(() => {
      this.state = next;
      if (next !== 'playing' && next !== 'muted') this.isBuffering = false;
      this.changeDetectorRef.detectChanges();
    });
  }

  private trackPlay(action: string): void {
    if (this.hasTrackedPlay) return;
    this.hasTrackedPlay = true;
    this.gtm.trackVideoPlay('challenge_intro_video', this.leadKey || undefined, { action });
  }

  /** Remembers the real (with-sound) position, at most every 2 s, or immediately when forced. */
  private saveProgress(force = false): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video || video.muted || !this.hasStarted) return;
    const second = Math.floor(video.currentTime);
    if (!force && Math.abs(second - this.lastSavedSecond) < 2) return;
    this.lastSavedSecond = second;
    try {
      localStorage.setItem(this.storageKey, String(video.ended ? video.duration : video.currentTime));
    } catch {
      // Private mode / storage blocked: resuming is a nicety, playback is unaffected.
    }
  }

  private readSavedPosition(): number | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const value = raw === null ? NaN : parseFloat(raw);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }
}
