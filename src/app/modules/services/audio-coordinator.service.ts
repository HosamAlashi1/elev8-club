import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioCoordinatorService {
  private activeAudio?: HTMLAudioElement;
  
  // 🔔 Subject لإطلاق حدث عندما يتم إيقاف صوت
  private audioPaused$ = new Subject<HTMLAudioElement>();
  
  // Observable للاشتراك من الكومبوننتات
  onAudioPaused$ = this.audioPaused$.asObservable();

  register(audio: HTMLAudioElement): void {
    // لو في صوت آخر شغال، وقّفه قبل تشغيل الجديد
    if (this.activeAudio && this.activeAudio !== audio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      
      // 🔔 أطلق حدث إيقاف الصوت القديم
      this.audioPaused$.next(this.activeAudio);
    }

    // حدّد الصوت الحالي كالنشط
    this.activeAudio = audio;
  }

  stopAll(): void {
    if (this.activeAudio) {
      const stoppedAudio = this.activeAudio;
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = undefined;
      
      // 🔔 أطلق حدث إيقاف
      this.audioPaused$.next(stoppedAudio);
    }
  }

  isActive(audio: HTMLAudioElement): boolean {
    return this.activeAudio === audio;
  }
}
