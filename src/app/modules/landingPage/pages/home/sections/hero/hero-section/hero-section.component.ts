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

  /** قراءة start_counter_date مباشرة من /settings */
  private loadCountdownSettings(): void {
    this.firebaseService
      .getObject('settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings: any) => {
          console.log('Countdown - settings object:', settings);

          if (settings && settings.start_counter_date) {
            const newStartDate = this.parseDate(settings.start_counter_date);

            if (!newStartDate || isNaN(newStartDate)) {
              console.warn('Countdown - invalid start_counter_date value:', settings.start_counter_date);
              return;
            }

            // Only initialize if start date changed or not set yet
            if (this.startCounterDate !== newStartDate) {
              this.startCounterDate = newStartDate;

              console.log(
                'Countdown - Start date loaded:',
                this.startCounterDate,
                new Date(this.startCounterDate)
              );

              // Clear any existing interval
              if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
              }

              if (this.startCounterDate > 0) {
                // Calculate end date (7 days after start)
                this.endDate = this.startCounterDate + 7 * 24 * 60 * 60 * 1000;

                console.log(
                  'Countdown - End date calculated:',
                  this.endDate,
                  new Date(this.endDate)
                );

                // Start countdown outside Angular zone for better performance
                this.ngZone.runOutsideAngular(() => {
                  // Start countdown with immediate update
                  this.lastUpdateTime = Date.now();
                  this.updateCountdown();

                  // Set interval to update every second precisely
                  this.countdownInterval = setInterval(() => {
                    const now = Date.now();
                    // Only update if at least 950ms have passed (accounting for drift)
                    if (now - this.lastUpdateTime >= 950) {
                      this.lastUpdateTime = now;
                      this.updateCountdown();
                      // Trigger change detection manually
                      this.ngZone.run(() => {
                        this.cdr.detectChanges();
                      });
                    }
                  }, 100); // Check every 100ms but only update every second
                });
              }
            }
          } else {
            console.warn('Countdown - settings or start_counter_date not found');
          }
        },
        error: (err) => {
          console.error('Error loading countdown settings:', err);
        }
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
      return 'مضى على التحدي';
    } else {
      return 'انتهى التحدي';
    }
  }

  get showCountdown(): boolean {
    return this.challengeStatus !== 'ended' && this.startCounterDate > 0;
  }
}
