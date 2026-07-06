import { ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-stats-section',
  templateUrl: './stats-section.component.html',
  styleUrls: ['./stats-section.component.css']
})
export class StatsSectionComponent implements OnInit, OnDestroy {
  @Input() onOpenRegistration!: () => void;

  private readonly studentsTarget = 50;
  private readonly profitsTarget = 600;
  private readonly animationDuration = 1800;
  private readonly profitsDelay = 120;

  studentsCount = 0;
  profitsCount = 0;
  isStatsActive = false;
  isCounting = false;

  flags = [
    { code: 'sa', name: 'السعودية' },
    { code: 'ae', name: 'الإمارات' },
    { code: 'jo', name: 'الأردن' },
    { code: 'kw', name: 'الكويت' },
    { code: 'qa', name: 'قطر' },
    { code: 'bh', name: 'البحرين' },
    { code: 'om', name: 'عُمان' },
    { code: 'eg', name: 'مصر' },
    { code: 'iq', name: 'العراق' },
    { code: 'lb', name: 'لبنان' },
    { code: 'ps', name: 'فلسطين' },
    { code: 'ma', name: 'المغرب' },
    { code: 'tn', name: 'تونس' },
    { code: 'dz', name: 'الجزائر' },
    { code: 'sy', name: 'سوريا' },
    { code: 'ly', name: 'ليبيا' },
  ];
  currentFlagIndex = 0;
  flagVisible = true;

  private observer!: IntersectionObserver;
  private animationDone = false;
  private flagInterval!: ReturnType<typeof setInterval>;
  private flagTimeout?: ReturnType<typeof setTimeout>;
  private animationInterval?: ReturnType<typeof setInterval>;

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (!('IntersectionObserver' in window)) {
      this.startStatsAnimation();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.animationDone) {
        this.ngZone.run(() => this.startStatsAnimation());
      }
    }, { threshold: 0.35, rootMargin: '0px 0px -12% 0px' });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    clearInterval(this.flagInterval);
    if (this.flagTimeout) {
      clearTimeout(this.flagTimeout);
    }
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  get formattedStudents(): string {
    return this.studentsCount + 'K';
  }

  get formattedProfits(): string {
    return '$' + this.profitsCount + 'K';
  }

  private startStatsAnimation(): void {
    if (this.animationDone) return;

    this.animationDone = true;
    this.isStatsActive = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.studentsCount = this.studentsTarget;
      this.profitsCount = this.profitsTarget;
      this.startFlagRotation();
      return;
    }

    this.isCounting = true;
    this.animateCounters();
    this.startFlagRotation();
  }

  private animateCounters(): void {
    const startedAt = performance.now();
    let lastStudents = -1;
    let lastProfits = -1;

    this.ngZone.runOutsideAngular(() => {
      this.animationInterval = setInterval(() => {
        const now = performance.now();
        const studentsProgress = this.clamp((now - startedAt) / this.animationDuration);
        const profitsProgress = this.clamp((now - startedAt - this.profitsDelay) / this.animationDuration);

        const nextStudents = Math.round(this.easeOutCubic(studentsProgress) * this.studentsTarget);
        const nextProfits = Math.round(this.easeOutCubic(profitsProgress) * this.profitsTarget);

        if (nextStudents !== lastStudents || nextProfits !== lastProfits) {
          lastStudents = nextStudents;
          lastProfits = nextProfits;
          this.studentsCount = nextStudents;
          this.profitsCount = nextProfits;
          this.cdr.detectChanges();
        }

        if (studentsProgress >= 1 && profitsProgress >= 1) {
          if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = undefined;
          }

          this.ngZone.run(() => {
            this.studentsCount = this.studentsTarget;
            this.profitsCount = this.profitsTarget;
            this.isCounting = false;
            this.cdr.detectChanges();
          });
        }
      }, 33);
    });
  }

  private startFlagRotation(): void {
    if (this.flagInterval) return;

    this.flagInterval = setInterval(() => {
      this.flagVisible = false;
      this.flagTimeout = setTimeout(() => {
        this.currentFlagIndex = (this.currentFlagIndex + 1) % this.flags.length;
        this.flagVisible = true;
      }, 90);
    }, 1700);
  }

  private easeOutCubic(value: number): number {
    return 1 - Math.pow(1 - value, 3);
  }

  private clamp(value: number): number {
    return Math.min(Math.max(value, 0), 1);
  }

  openRegistration(): void {
    if (this.onOpenRegistration) {
      this.onOpenRegistration();
    }
  }
}
