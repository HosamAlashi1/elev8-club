import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * 🎧 Audio Player Service
 * Manages global audio playback state and coordinates between different audio sources
 */

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  type: 'project' | 'chapter' | 'paragraph';
  coverLetter?: string; // First letter for mini dock avatar
  duration?: number;
}

export interface PlaybackState {
  track: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0-100
}

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private audioElement: HTMLAudioElement | null = null;
  private currentTrackSubject = new BehaviorSubject<AudioTrack | null>(null);
  private playbackStateSubject = new BehaviorSubject<PlaybackState>({
    track: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0
  });

  // Public observables
  public currentTrack$: Observable<AudioTrack | null> = this.currentTrackSubject.asObservable();
  public playbackState$: Observable<PlaybackState> = this.playbackStateSubject.asObservable();

  constructor() {
    this.initializeAudioElement();
  }

  /**
   * Initialize global audio element with event listeners
   */
  private initializeAudioElement(): void {
    this.audioElement = new Audio();
    this.audioElement.preload = 'metadata';

    // Time update
    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.audioElement) return;
      this.updatePlaybackState({
        currentTime: this.audioElement.currentTime,
        duration: this.audioElement.duration || 0,
        progress: this.audioElement.duration 
          ? (this.audioElement.currentTime / this.audioElement.duration) * 100 
          : 0
      });
    });

    // Ended
    this.audioElement.addEventListener('ended', () => {
      this.updatePlaybackState({ isPlaying: false, currentTime: 0, progress: 0 });
    });

    // Loaded metadata
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (!this.audioElement) return;
      this.updatePlaybackState({ duration: this.audioElement.duration || 0 });
    });

    // Error
    this.audioElement.addEventListener('error', () => {
      console.error('Audio playback error');
      this.stop();
    });
  }

  /**
   * Load and play a track
   */
  public play(track: AudioTrack): void {
    if (!this.audioElement) return;

    const currentState = this.playbackStateSubject.value;
    
    // If same track is paused, just resume
    if (currentState.track?.id === track.id && !currentState.isPlaying) {
      this.audioElement.play();
      this.updatePlaybackState({ isPlaying: true });
      return;
    }

    // Stop current track if different
    if (currentState.track?.id !== track.id) {
      this.stop();
      this.audioElement.src = track.url;
      this.currentTrackSubject.next(track);
    }

    // Play
    this.audioElement.play()
      .then(() => {
        this.updatePlaybackState({ track, isPlaying: true });
      })
      .catch(err => {
        console.error('Play failed:', err);
      });
  }

  /**
   * Pause current track
   */
  public pause(): void {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.updatePlaybackState({ isPlaying: false });
  }

  /**
   * Stop and reset
   */
  public stop(): void {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.updatePlaybackState({ 
      isPlaying: false, 
      currentTime: 0, 
      progress: 0 
    });
  }

  /**
   * Toggle play/pause
   */
  public togglePlayPause(track?: AudioTrack): void {
    const currentState = this.playbackStateSubject.value;
    
    if (track && currentState.track?.id !== track.id) {
      this.play(track);
    } else if (currentState.isPlaying) {
      this.pause();
    } else if (track) {
      this.play(track);
    }
  }

  /**
   * Seek to specific time
   */
  public seek(seconds: number): void {
    if (!this.audioElement) return;
    this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration || 0));
  }

  /**
   * Seek relative (e.g., +5s or -5s)
   */
  public seekRelative(seconds: number): void {
    if (!this.audioElement) return;
    this.seek(this.audioElement.currentTime + seconds);
  }

  /**
   * Set volume (0-1)
   */
  public setVolume(volume: number): void {
    if (!this.audioElement) return;
    this.audioElement.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle mute
   */
  public toggleMute(): void {
    if (!this.audioElement) return;
    this.audioElement.muted = !this.audioElement.muted;
  }

  /**
   * Check if specific track is currently playing
   */
  public isTrackPlaying(trackId: string): boolean {
    const state = this.playbackStateSubject.value;
    return state.track?.id === trackId && state.isPlaying;
  }

  /**
   * Get current playback state
   */
  public getCurrentState(): PlaybackState {
    return this.playbackStateSubject.value;
  }

  /**
   * Update playback state (internal)
   */
  private updatePlaybackState(partial: Partial<PlaybackState>): void {
    const current = this.playbackStateSubject.value;
    this.playbackStateSubject.next({ ...current, ...partial });
  }

  /**
   * Format time for display (00:00)
   */
  public static formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Cleanup on destroy
   */
  public ngOnDestroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }
}
