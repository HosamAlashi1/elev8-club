import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly notificationSoundUrl = '/assets/sounds/notification.mp3';
  private audioContext: AudioContext | null = null;
  private notificationAudio: HTMLAudioElement | null = null;
  private unlockInstalled = false;

  constructor() {
    this.installAudioUnlock();
  }

  requestBrowserPermission(): Promise<NotificationPermission | undefined> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
      return Promise.resolve(undefined);
    }

    return Notification.requestPermission();
  }

  playIncoming(): void {
    const audio = this.getNotificationAudio();
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  playSent(): void {
    this.playTone([
      { frequency: 520, offset: 0, duration: 0.08 },
      { frequency: 700, offset: 0.07, duration: 0.1 }
    ], 0.045);
  }

  showBrowserNotification(title: string, body: string, onClick?: () => void): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/assets/img/blank.png',
      tag: 'elev8-support-chat'
    });

    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  }

  private installAudioUnlock(): void {
    if (this.unlockInstalled || typeof document === 'undefined') return;

    this.unlockInstalled = true;
    const unlock = () => {
      const notificationAudio = this.getNotificationAudio();
      if (notificationAudio) {
        notificationAudio.muted = true;
        void notificationAudio.play()
          .then(() => {
            notificationAudio.pause();
            notificationAudio.currentTime = 0;
            notificationAudio.muted = false;
          })
          .catch(() => {
            notificationAudio.muted = false;
          });
      }

      const context = this.getAudioContext();
      if (context?.state === 'suspended') {
        void context.resume().catch(() => undefined);
      }
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };

    document.addEventListener('pointerdown', unlock, { capture: true, once: true });
    document.addEventListener('keydown', unlock, { capture: true, once: true });
  }

  private getNotificationAudio(): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;

    if (!this.notificationAudio) {
      this.notificationAudio = new Audio(this.notificationSoundUrl);
      this.notificationAudio.preload = 'auto';
      this.notificationAudio.volume = 0.7;
    }

    return this.notificationAudio;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return null;
    this.audioContext ??= new AudioContextClass();
    return this.audioContext;
  }

  private playTone(
    tones: Array<{ frequency: number; offset: number; duration: number }>,
    volume = 0.075
  ): void {
    const context = this.getAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }

    const now = context.currentTime;
    tones.forEach(tone => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = now + tone.offset;
      const endsAt = startsAt + tone.duration;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(tone.frequency, startsAt);
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(endsAt + 0.02);
    });
  }
}
