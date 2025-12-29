import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { GtmService } from '../../../../../services/gtm.service';
import Hls from 'hls.js';

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
export class VideoHeroSectionComponent implements OnInit, AfterViewInit {
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

  private leadKey: string | null = null;
  private hasTrackedPlay = false;
  private hasTrackedComplete = false;
  private controlsTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private gtm: GtmService
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

    // -------------------------------
    //        H L S   L O A D E R
    // -------------------------------
    const hlsSource = 'assets/videos/hls_here_1/here_1.m3u8';

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });

      hls.loadSource(hlsSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS Manifest loaded successfully");
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS ERROR:", data);
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSource;
    }

    // -------------------------------
    //         EXISTING EVENTS
    // -------------------------------

    video.volume = this.volume;
    video.muted = false;
    this.isMuted = false;

    video.addEventListener('loadedmetadata', () => {
      this.duration = video.duration;
    });

    video.addEventListener('timeupdate', () => {
      this.currentTime = video.currentTime;
      this.progress = (video.currentTime / video.duration) * 100;

      if (this.progress >= 95 && !this.hasTrackedComplete) {
        this.gtm.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
        this.hasTrackedComplete = true;
      }
    });

    video.addEventListener('ended', () => {
      this.isPlaying = false;

      if (!this.hasTrackedComplete) {
        this.gtm.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
        this.hasTrackedComplete = true;
      }
    });
  }

  togglePlay(): void {
    const video = this.videoPlayer.nativeElement;

    if (this.isPlaying) {
      video.pause();
    } else {
      video.play();

      if (!this.hasTrackedPlay) {
        this.gtm.trackVideoPlay('challenge_intro_video', this.leadKey || undefined);
        this.hasTrackedPlay = true;
      }
    }
    this.isPlaying = !this.isPlaying;
  }

  seek(event: MouseEvent): void {
    const video = this.videoPlayer.nativeElement;
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const pos = (rect.right - event.clientX) / rect.width;
    video.currentTime = pos * video.duration;
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

  toggleFullscreen(): void {
    const container = this.videoPlayer.nativeElement.parentElement;
    if (!container) return;

    if (!this.isFullscreen) {
      if (container.requestFullscreen) container.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    this.isFullscreen = !this.isFullscreen;
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
    console.log('Video data loaded successfully');
    const video = this.videoPlayer.nativeElement;
    video.volume = this.volume;
  }

  onVideoCanPlay(): void {
    console.log('Video can play - ready for playback');
  }

  onVideoPlay(): void {
    this.isPlaying = true;
    if (!this.hasTrackedPlay) {
      this.gtm.trackVideoPlay('challenge_intro_video', this.leadKey || undefined);
      this.hasTrackedPlay = true;
    }
  }

  onVideoPause(): void {
    this.isPlaying = false;
  }

  onVideoError(event: Event): void {
    console.error('Video failed to load:', event);
    const video = event.target as HTMLVideoElement;
    if (video.error) {
      console.error('Error code:', video.error.code);
      console.error('Error message:', video.error.message);
    }
  }

}
