import { Component, Input } from '@angular/core';

interface VideoState {
  url: string;
  name: string;
  location: string;
  duration: string;
  poster?: string;
  currentTime?: number;
  totalDuration?: number;
  isPlaying?: boolean;
  volume?: number;
  isMuted?: boolean;
  isLoaded?: boolean;
}

@Component({
  selector: 'app-video-testimonials-section',
  templateUrl: './video-testimonials-section.component.html',
  styleUrls: ['./video-testimonials-section.component.css']
})
export class VideoTestimonialsSectionComponent {

  @Input() onOpenRegistration!: () => void;

  videos: VideoState[] = [
    {
      url: "assets/videos/video1.mp4",
      name: "هيثم",
      location: "سوريا",
      duration: "0:22"
    },
    {
      url: "assets/videos/video2.mp4",
      name: "ابو بكر",
      location: "ليبيا ",
      duration: "0:28"
    },
    {
      url: "assets/videos/video3.mp4",
      name: "هيثم",
      location: "تركيا",
      duration: "0:31"
    },
    {
      url: "assets/videos/video4.mp4",
      name: "لويس",
      location: "لبنان",
      duration: "0:25"
    },
    {
      url: "assets/videos/video5.mp4",
      name: "أمل",
      location: "المغرب",
      duration: "0:29"
    },
    {
      url: "assets/videos/video6.mp4",
      name: "أنصار",
      location: "فلسطين",
      duration: "0:26"
    }
  ];

  currentIndex = 0;
  visibleVideos: VideoState[] = [];
  currentPlayingVideo: VideoState | null = null;
  showProgressThumb: VideoState | null = null;
  showVolumeSlider: VideoState | null = null;

  ngOnInit() {
    // تهيئة حالة الفيديوهات
    this.videos.forEach(v => {
      v.currentTime = 0;
      v.totalDuration = 0;
      v.isPlaying = false;
      v.volume = 100;
      v.isMuted = false;
      v.isLoaded = false;
    });
    this.updateVisible();
    this.generateThumbnails();
  }

  updateVisible() {
    this.visibleVideos = this.videos.slice(this.currentIndex, this.currentIndex + 2);
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.videos.length;
    this.updateVisible();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.videos.length) % this.videos.length;
    this.updateVisible();
  }

  goTo(i: number) {
    this.currentIndex = i;
    this.updateVisible();
  }

  // ========== تشغيل/إيقاف ==========
  togglePlayPause(videoState: VideoState, videoElement: HTMLVideoElement) {
    // إيقاف جميع الفيديوهات الأخرى
    if (!videoState.isPlaying) {
      this.pauseAllVideos();
    }

    if (videoElement.paused) {
      videoElement.play();
      videoState.isPlaying = true;
      this.currentPlayingVideo = videoState;
    } else {
      videoElement.pause();
      videoState.isPlaying = false;
      this.currentPlayingVideo = null;
    }
  }

  pauseAllVideos() {
    this.videos.forEach(v => {
      v.isPlaying = false;
    });
    this.currentPlayingVideo = null;
    
    // إيقاف جميع عناصر الفيديو
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(v => v.pause());
  }

  isPlaying(videoState: VideoState): boolean {
    return videoState.isPlaying || false;
  }

  onVideoEnded(videoState: VideoState, videoElement: HTMLVideoElement) {
    videoState.isPlaying = false;
    videoState.currentTime = 0;
    videoElement.currentTime = 0;
    this.currentPlayingVideo = null;
  }

  // ========== Progress Bar ==========
  onTimeUpdate(videoState: VideoState, videoElement: HTMLVideoElement) {
    videoState.currentTime = videoElement.currentTime;
  }

  onLoadedMetadata(videoState: VideoState, videoElement: HTMLVideoElement) {
    videoState.totalDuration = videoElement.duration;
  }

  onVideoLoaded(videoState: VideoState, videoElement: HTMLVideoElement) {
    videoState.isLoaded = true;
    // Force load first frame for iOS
    if (!videoState.poster && videoElement.currentTime === 0) {
      videoElement.currentTime = 0.1;
      setTimeout(() => {
        videoElement.currentTime = 0;
      }, 100);
    }
  }

  onVideoCanPlay(videoState: VideoState, videoElement: HTMLVideoElement) {
    videoState.isLoaded = true;
  }

  // Generate thumbnails dynamically if poster images don't exist
  generateThumbnails() {
    // This will attempt to load first frame of each video
    // iOS Safari will show poster or first frame once loaded
    setTimeout(() => {
      const videoElements = document.querySelectorAll('.video-element') as NodeListOf<HTMLVideoElement>;
      videoElements.forEach((video, index) => {
        if (this.videos[index] && !this.videos[index].isLoaded) {
          // Force iOS to load first frame
          video.load();
        }
      });
    }, 500);
  }

  getProgress(videoState: VideoState): number {
    if (!videoState.totalDuration) return 0;
    return ((videoState.currentTime || 0) / videoState.totalDuration) * 100;
  }

  seekTo(videoState: VideoState, videoElement: HTMLVideoElement, event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    // RTL: نحسب من اليمين بدل اليسار
    const clickX = rect.right - event.clientX;
    const percentage = clickX / rect.width;
    const newTime = percentage * (videoState.totalDuration || 0);
    
    videoElement.currentTime = newTime;
    videoState.currentTime = newTime;
  }

  // ========== التقديم والتأخير ==========
  skip(videoState: VideoState, videoElement: HTMLVideoElement, seconds: number) {
    const newTime = (videoState.currentTime || 0) + seconds;
    const clampedTime = Math.max(0, Math.min(newTime, videoState.totalDuration || 0));
    
    videoElement.currentTime = clampedTime;
    videoState.currentTime = clampedTime;
  }

  // ========== تنسيق الوقت ==========
  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getCurrentTime(videoState: VideoState): number {
    return videoState.currentTime || 0;
  }

  getDuration(videoState: VideoState): string {
    if (videoState.totalDuration) {
      return this.formatTime(videoState.totalDuration);
    }
    return videoState.duration;
  }

  // ========== الصوت ==========
  getVolume(videoState: VideoState): number {
    return videoState.volume || 100;
  }

  setVolume(videoState: VideoState, videoElement: HTMLVideoElement, event: any) {
    const volume = parseInt(event.target.value);
    videoState.volume = volume;
    videoElement.volume = volume / 100;
    
    if (volume === 0) {
      videoState.isMuted = true;
    } else {
      videoState.isMuted = false;
    }
  }

  toggleMute(videoState: VideoState, videoElement: HTMLVideoElement) {
    videoState.isMuted = !videoState.isMuted;
    videoElement.muted = videoState.isMuted || false;
  }

  isMuted(videoState: VideoState): boolean {
    return videoState.isMuted || false;
  }

  // ========== شاشة كاملة ==========
  toggleFullscreen(videoElement: HTMLVideoElement) {
    const videoBox = videoElement.closest('.video-box') as any;
    
    if (!document.fullscreenElement) {
      // تفعيل الشاشة الكاملة
      if (videoBox.requestFullscreen) {
        videoBox.requestFullscreen();
      } else if (videoBox.webkitRequestFullscreen) {
        videoBox.webkitRequestFullscreen();
      } else if (videoBox.msRequestFullscreen) {
        videoBox.msRequestFullscreen();
      }
    } else {
      // الخروج من الشاشة الكاملة
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

}
