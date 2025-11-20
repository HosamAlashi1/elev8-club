import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

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
export class VideoHeroSectionComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  isPlaying = false;
  showControls = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  isFullscreen = false;
  progress = 0;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const video = this.videoPlayer.nativeElement;
    
    video.addEventListener('loadedmetadata', () => {
      this.duration = video.duration;
    });

    video.addEventListener('timeupdate', () => {
      this.currentTime = video.currentTime;
      this.progress = (video.currentTime / video.duration) * 100;
    });

    video.addEventListener('ended', () => {
      this.isPlaying = false;
    });
  }

  togglePlay(): void {
    const video = this.videoPlayer.nativeElement;
    if (this.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  seek(event: MouseEvent): void {
    const video = this.videoPlayer.nativeElement;
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    // RTL: Calculate from right to left
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
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    this.isFullscreen = !this.isFullscreen;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

}
