import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AnimationOptions } from 'ngx-lottie';

export interface LottieOverlayConfig {
  visible: boolean;
  options: AnimationOptions;
  message?: string;
  messageClass?: string;
  autoCloseDelay?: number;
}

@Injectable({ providedIn: 'root' })
export class LottieOverlayService {
  private stateSubject = new BehaviorSubject<LottieOverlayConfig>({
    visible: false,
    options: { path: '' }
  });

  readonly state$ = this.stateSubject.asObservable();

  show(config: LottieOverlayConfig) {
    this.stateSubject.next({ ...config, visible: true });

    if (config.autoCloseDelay) {
      setTimeout(() => this.hide(), config.autoCloseDelay);
    }
  }

  hide() {
    this.stateSubject.next({ visible: false, options: { path: '' } });
  }
}