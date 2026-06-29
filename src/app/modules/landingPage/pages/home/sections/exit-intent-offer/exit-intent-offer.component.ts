import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-exit-intent-offer',
  templateUrl: './exit-intent-offer.component.html',
  styleUrls: ['./exit-intent-offer.component.css']
})
export class ExitIntentOfferComponent implements OnInit, OnDestroy {
  @Input() isRegistrationOpen = false;
  @Output() register = new EventEmitter<void>();

  isVisible = false;

  private readonly storageKey = 'elev8_exit_intent_offer_seen_v2';
  private readonly exitDwellMs = 90000;
  private readonly engagedDwellMs = 90000;
  private readonly passiveDwellMs = 90000;
  private readonly mobileIdleMs = 14000;
  private enteredAt = Date.now();
  private lastScrollY = 0;
  private maxScrollProgress = 0;
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private passiveTimeout: ReturnType<typeof setTimeout> | null = null;
  private listenersAttached = false;
  private originalBodyOverflow = '';

  ngOnInit(): void {
    if (typeof window === 'undefined' || this.wasHandled()) {
      return;
    }

    this.enteredAt = Date.now();
    this.lastScrollY = window.scrollY || 0;
    this.originalBodyOverflow = document.body.style.overflow;
    this.attachListeners();
    this.resetIdleTimer();
    this.passiveTimeout = setTimeout(() => {
      if (this.canShowAfter(this.passiveDwellMs, 0)) {
        this.show();
      }
    }, this.passiveDwellMs);
  }

  close(): void {
    this.markHandled();
    this.clearPromptTimers();
    this.hide();
  }

  continueToRegistration(): void {
    this.markHandled();
    this.clearPromptTimers();
    this.hide();
    this.register.emit();
  }

  private attachListeners(): void {
    if (this.listenersAttached) {
      return;
    }

    window.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('mouseout', this.handleMouseOut);
    window.addEventListener('keydown', this.handleKeydown);
    this.listenersAttached = true;
  }

  private detachListeners(): void {
    if (!this.listenersAttached || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('mouseout', this.handleMouseOut);
    window.removeEventListener('keydown', this.handleKeydown);
    this.listenersAttached = false;
  }

  private handleMouseOut = (event: MouseEvent): void => {
    const leavingWindow = event.clientY <= 8 && !event.relatedTarget;

    if (leavingWindow && this.isDesktop() && this.canShowAfter(this.exitDwellMs, 0)) {
      this.show();
    }
  };

  private handleScroll = (): void => {
    const currentY = window.scrollY || 0;
    const progress = this.getScrollProgress();
    const movedUp = this.lastScrollY - currentY;

    this.maxScrollProgress = Math.max(this.maxScrollProgress, progress);
    this.lastScrollY = currentY;

    if (this.maxScrollProgress >= 0.28 && this.canShowAfter(this.engagedDwellMs, 0.2)) {
      this.show();
      return;
    }

    if (this.isMobile() && this.maxScrollProgress >= 0.45 && movedUp > 70 && this.canShowAfter(this.engagedDwellMs, 0.35)) {
      this.show();
      return;
    }

    this.resetIdleTimer();
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isVisible) {
      this.close();
    }
  };

  private resetIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      if (this.maxScrollProgress >= 0.25 && this.canShowAfter(this.engagedDwellMs, 0.2)) {
        this.show();
      } else if (!this.isVisible && !this.wasHandled()) {
        this.resetIdleTimer();
      }
    }, this.mobileIdleMs);
  }

  private show(): void {
    if (this.isVisible || this.isRegistrationOpen || this.wasHandled()) {
      return;
    }

    this.isVisible = true;
    this.clearPromptTimers();
    document.body.style.overflow = 'hidden';
  }

  private hide(): void {
    this.isVisible = false;
    document.body.style.overflow = this.originalBodyOverflow;
  }

  private canShowAfter(dwellMs: number, requiredProgress: number): boolean {
    return !this.isVisible
      && !this.isRegistrationOpen
      && !this.wasHandled()
      && Date.now() - this.enteredAt >= dwellMs
      && this.getScrollProgress() >= requiredProgress;
  }

  private getScrollProgress(): number {
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );
    const scrollable = Math.max(documentHeight - window.innerHeight, 1);

    return Math.min(Math.max((window.scrollY || 0) / scrollable, 0), 1);
  }

  private isDesktop(): boolean {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private isMobile(): boolean {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  private wasHandled(): boolean {
    try {
      return sessionStorage.getItem(this.storageKey) === '1';
    } catch {
      return false;
    }
  }

  private markHandled(): void {
    try {
      sessionStorage.setItem(this.storageKey, '1');
    } catch {
      return;
    }
  }

  private clearPromptTimers(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    if (this.passiveTimeout) {
      clearTimeout(this.passiveTimeout);
      this.passiveTimeout = null;
    }
  }

  ngOnDestroy(): void {
    this.detachListeners();
    this.clearPromptTimers();

    if (this.isVisible && typeof document !== 'undefined') {
      document.body.style.overflow = this.originalBodyOverflow;
    }
  }
}
