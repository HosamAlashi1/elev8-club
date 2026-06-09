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

  challengeStatus: 'not-started' | 'ended' = 'not-started';
  startCounterDate: number = 0;
  isCountdownLoaded = false;

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

  private loadCountdownSettings(): void {
    this.firebaseService
      .getObject('settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings: any) => {
          if (!settings?.start_counter_date) {
            console.warn('Countdown - settings.start_counter_date not found');
            this.isCountdownLoaded = false;
            return;
          }

          const firebaseStartDate = this.parseDate(settings.start_counter_date);

          if (!firebaseStartDate || isNaN(firebaseStartDate)) {
            console.warn('Countdown - invalid start_counter_date value:', settings.start_counter_date);
            this.isCountdownLoaded = false;
            return;
          }

          this.isCountdownLoaded = true;
          this.initializeCountdown(firebaseStartDate);
        },
        error: (err) => {
          console.error('Error loading countdown settings:', err);
        }
      });
  }

  private initializeCountdown(startDate: number): void {
    if (!startDate || isNaN(startDate) || this.startCounterDate === startDate) {
      return;
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.startCounterDate = startDate;
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

    if (typeof dateValue === 'number') {
      return dateValue < 10000000000 ? dateValue * 1000 : dateValue;
    }

    if (typeof dateValue === 'string') {
      const trimmedValue = dateValue.trim();
      const numericValue = Number(trimmedValue);

      if (!Number.isNaN(numericValue)) {
        return numericValue < 10000000000 ? numericValue * 1000 : numericValue;
      }

      const timestamp = new Date(trimmedValue).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    }

    return 0;
  }

  private updateCountdown(): void {
    const now = Date.now();

    if (now < this.startCounterDate) {
      this.challengeStatus = 'not-started';
      const timeUntilStart = this.startCounterDate - now;
      this.calculateTimeRemaining(timeUntilStart);
    } else {
      this.challengeStatus = 'ended';
      this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
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

  get countdownLabel(): string {
    if (this.challengeStatus === 'not-started') {
      return 'باقي على بداية التحدي';
    }

    return 'انطلق التحدي';
  }

  get showCountdown(): boolean {
    return this.isCountdownLoaded && this.startCounterDate > 0 && this.challengeStatus === 'not-started';
  }

  get webinarDateLabel(): string {
    if (!this.startCounterDate) return 'قريباً';

    const date = new Date(this.startCounterDate);
    const weekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    const period = hours24 >= 12 ? 'مساء' : 'صباحاً';
    const hour12 = hours24 % 12 || 12;
    const minuteLabel = minutes ? `:${minutes.toString().padStart(2, '0')}` : '';

    return `${weekday} ${day}-${month} / الساعة ${hour12}${minuteLabel} ${period}`;
  }

  formatUnit(value: number): string {
    if (!this.isCountdownLoaded) return '--';

    return value.toString().padStart(2, '0');
  }
}
