import { Component, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';

@Component({
  selector: 'app-stats-section',
  templateUrl: './stats-section.component.html',
  styleUrls: ['./stats-section.component.css']
})
export class StatsSectionComponent implements OnInit, OnDestroy {
  @Input() onOpenRegistration!: () => void;

  studentsCount = 0;
  profitsCount = 0;

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

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.animationDone) {
        this.animationDone = true;
        this.animateCounter(50000, 2200, (v) => this.studentsCount = v);
        this.animateCounter(600000, 2200, (v) => this.profitsCount = v);
        this.flagInterval = setInterval(() => {
          this.flagVisible = false;
          setTimeout(() => {
            this.currentFlagIndex = (this.currentFlagIndex + 1) % this.flags.length;
            this.flagVisible = true;
          }, 60);
        }, 1800);
      }
    }, { threshold: 0.3 });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    clearInterval(this.flagInterval);
  }

  get formattedStudents(): string {
    const k = Math.round(this.studentsCount / 1000);
    return k + 'K';
  }

  get formattedProfits(): string {
    const k = Math.round(this.profitsCount / 1000);
    return k + 'K$';
  }

  private animateCounter(target: number, duration: number, setter: (v: number) => void): void {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setter(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  openRegistration(): void {
    if (this.onOpenRegistration) {
      this.onOpenRegistration();
    }
  }
}
