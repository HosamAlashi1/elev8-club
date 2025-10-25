import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioSfxService {
  private sounds?: { flip: HTMLAudioElement; drag: HTMLAudioElement };
  private enabled = true;
  private volume = 0.35;

  /**
   * Initialize audio with URLs
   */
  init(urls: { flip: string; drag: string }, enabled = true, volume = 0.35): void {
    this.enabled = enabled;
    this.volume = volume;

    // Create silent fallback audio
    const createSilentAudio = () => {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.volume = 0;
      return audio;
    };

    this.sounds = {
      flip: new Audio(urls.flip),
      drag: new Audio(urls.drag)
    };

    // Configure all sounds
    Object.entries(this.sounds).forEach(([name, audio]) => {
      audio.volume = this.volume;
      audio.preload = 'auto';
      // If error, replace with silent audio
      audio.addEventListener('error', () => {
        console.warn(`Audio file not found: ${name}. Using silent fallback.`);
        if (this.sounds) {
          this.sounds[name as 'flip' | 'drag'] = createSilentAudio();
        }
      });
    });
  }

  /**
   * Enable/disable all sounds
   */
  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Set volume for all sounds (0-1)
   */
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.sounds) {
      Object.values(this.sounds).forEach(audio => {
        audio.volume = this.volume;
      });
    }
  }

  /**
   * Play a sound effect
   */
  play(name: 'flip' | 'drag'): void {
    if (!this.enabled || !this.sounds) return;

    try {
      const audio = this.sounds[name];
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn(`Failed to play ${name} sound:`, err);
      });
    } catch (err) {
      console.warn(`Error playing ${name} sound:`, err);
    }
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
}
