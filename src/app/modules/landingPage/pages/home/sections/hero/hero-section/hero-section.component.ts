import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { Subject, takeUntil } from 'rxjs';
import { trigger, style, transition, animate } from '@angular/animations';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
  animations: [
    trigger('flipAnimation', [
      transition('* => *', [
        style({
          transform: 'scale(1)',
          opacity: 1
        }),
        animate(
          '150ms ease-out',
          style({
            transform: 'scale(1.15)',
            opacity: 0.7
          })
        ),
        animate(
          '150ms ease-in',
          style({
            transform: 'scale(1)',
            opacity: 1
          })
        )
      ])
    ])
  ]
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  @Input() onOpenRegistration!: () => void;

  private destroy$ = new Subject<void>();
  private countdownInterval: any;
  private lastUpdateTime: number = 0;

  countdown: CountdownTime = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  challengeStatus: 'not-started' | 'active' | 'ended' = 'not-started';
  startCounterDate: number = 0;
  endDate: number = 0;

  constructor(
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadCountdownSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /** مؤقتا: موعد تجريبي بعد 20 يوم. بلوك Firebase جاهز تحت للتفعيل لاحقا. */
  private loadCountdownSettings(): void {
    const temporaryStartDate = Date.now() + 20 * 24 * 60 * 60 * 1000;
    this.initializeCountdown(temporaryStartDate);

    /*
    قراءة الموعد الحقيقي من Firebase:
    نفس المكان السابق: /settings
    نفس الفيلد السابق: start_counter_date

    this.firebaseService
      .getObject('settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings: any) => {
          if (!settings?.start_counter_date) {
            console.warn('Countdown - settings.start_counter_date not found');
            return;
          }

          const firebaseStartDate = this.parseDate(settings.start_counter_date);

          if (!firebaseStartDate || isNaN(firebaseStartDate)) {
            console.warn('Countdown - invalid start_counter_date value:', settings.start_counter_date);
            return;
          }

          this.initializeCountdown(firebaseStartDate);
        },
        error: (err) => {
          console.error('Error loading countdown settings:', err);
        }
      });
    */
  }

  private initializeCountdown(startDate: number): void {
    if (!startDate || isNaN(startDate) || this.startCounterDate === startDate) {
      return;
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.startCounterDate = startDate;
    this.endDate = this.startCounterDate + 7 * 24 * 60 * 60 * 1000;
    this.lastUpdateTime = Date.now();
    this.updateCountdown();

    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        const now = Date.now();

        if (now - this.lastUpdateTime >= 950) {
          this.lastUpdateTime = now;
          this.updateCountdown();

          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        }
      }, 100);
    });
  }

  /** نفس parseDate اللي عملناه في صفحة الإعدادات */
  private parseDate(dateValue: any): number {
    if (!dateValue) return 0;

    // If it's already a number (timestamp)
    if (typeof dateValue === 'number') return dateValue;

    // If it's a string date format (ISO, …)
    if (typeof dateValue === 'string') {
      const timestamp = new Date(dateValue).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    }

    return 0;
  }

  private updateCountdown(): void {
    const now = Date.now();

    // Check challenge status
    if (now < this.startCounterDate) {
      this.challengeStatus = 'not-started';
      // Calculate time until challenge starts (countdown)
      const timeUntilStart = this.startCounterDate - now;
      this.calculateTimeRemaining(timeUntilStart);
    } else if (now >= this.startCounterDate && now < this.endDate) {
      this.challengeStatus = 'active';
      // Calculate time elapsed since start (count UP)
      const timeElapsed = now - this.startCounterDate;
      this.calculateTimeElapsed(timeElapsed);
    } else {
      this.challengeStatus = 'ended';
      this.countdown = { days: 7, hours: 0, minutes: 0, seconds: 0 };
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  private calculateTimeRemaining(milliseconds: number): void {
    if (milliseconds <= 0) {
      this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return;
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    this.countdown = {
      days: days,
      hours: totalHours % 24,
      minutes: totalMinutes % 60,
      seconds: totalSeconds % 60
    };
  }

  private calculateTimeElapsed(milliseconds: number): void {
    if (milliseconds <= 0) {
      this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return;
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    // Count UP: show how much time has passed
    this.countdown = {
      days: days,
      hours: totalHours % 24,
      minutes: totalMinutes % 60,
      seconds: totalSeconds % 60
    };
  }

  get countdownLabel(): string {
    if (this.challengeStatus === 'not-started') {
      return 'يبدأ التحدي خلال';
    } else if (this.challengeStatus === 'active') {
      return 'التحدي يجري الآن';
    } else {
      return 'انتهى التحدي';
    }
  }

  get showCountdown(): boolean {
    return this.challengeStatus !== 'ended' && this.startCounterDate > 0;
  }
}
