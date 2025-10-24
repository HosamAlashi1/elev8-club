import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AudioPlayerService, PlaybackState } from 'src/app/modules/services/audio-player.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * 🎧 Mini Audio Dock
 * Fixed bottom player that appears while any audio is playing
 */
@Component({
  selector: 'app-audio-dock',
  templateUrl: './audio-dock.component.html',
  styleUrls: ['./audio-dock.component.css'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class AudioDockComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private audioService = inject(AudioPlayerService);

  public playbackState: PlaybackState = {
    track: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0
  };

  public isVisible = false;
  public volume = 1;
  public isMuted = false;

  ngOnInit(): void {
    // Subscribe to playback state
    this.audioService.playbackState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.playbackState = state;
        this.isVisible = !!state.track; // Show dock when there's a track
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle play/pause
   */
  public togglePlayPause(): void {
    if (this.playbackState.track) {
      this.audioService.togglePlayPause(this.playbackState.track);
    }
  }

  /**
   * Toggle mute
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.audioService.toggleMute();
  }

  /**
   * Handle volume change
   */
  public onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.volume = parseFloat(input.value);
    this.audioService.setVolume(this.volume);
  }

  /**
   * Get formatted time display
   */
  public getTimeDisplay(): string {
    const current = AudioPlayerService.formatTime(this.playbackState.currentTime);
    const total = AudioPlayerService.formatTime(this.playbackState.duration);
    return `${current} / ${total}`;
  }

  /**
   * Get track title
   */
  public getTrackTitle(): string {
    if (!this.playbackState.track) return '';
    
    switch (this.playbackState.track.type) {
      case 'project':
        return 'Project Voice';
      case 'chapter':
        return 'Chapter Voice';
      case 'paragraph':
        return this.playbackState.track.title.length > 40
          ? this.playbackState.track.title.substring(0, 40) + '...'
          : this.playbackState.track.title;
      default:
        return 'Audio';
    }
  }

  /**
   * Get cover letter (first letter of project/chapter for avatar)
   */
  public getCoverLetter(): string {
    return this.playbackState.track?.coverLetter || '';
  }

  /**
   * Keyboard shortcuts
   */
  @HostListener('document:keydown', ['$event'])
  public handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Only if dock is visible and not typing in input
    if (!this.isVisible) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.audioService.seekRelative(-5);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.audioService.seekRelative(5);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.volume = Math.min(1, this.volume + 0.1);
        this.audioService.setVolume(this.volume);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.volume = Math.max(0, this.volume - 0.1);
        this.audioService.setVolume(this.volume);
        break;
    }
  }
}
