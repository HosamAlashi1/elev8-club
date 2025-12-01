import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-live-registrations',
  templateUrl: './live-registrations.component.html',
  styleUrls: ['./live-registrations.component.css'],
  animations: [
    trigger('slideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate3d(40px,15px,0)' }),
        animate(
          '450ms cubic-bezier(.18,.89,.32,1.28)',
          style({ opacity: 1, transform: 'translate3d(0,0,0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '350ms cubic-bezier(.55,.06,.68,.19)',
          style({ opacity: 0, transform: 'translate3d(40px,20px,0)' })
        ),
      ]),
    ]),
  ],
})
export class LiveRegistrationsComponent implements OnInit, OnDestroy {
  registrations = [
    { name: 'أحمد', country: 'مصر' },
    { name: 'محمد', country: 'الأردن' },
    { name: 'ليلى', country: 'السعودية' },
    { name: 'سرين', country: 'تونس' },
    { name: 'علي', country: 'الإمارات' },
    { name: 'هند', country: 'الكويت' },
    { name: 'يوسف', country: 'المغرب' },
    { name: 'سارة', country: 'قطر' },
    { name: 'عمر', country: 'ليبيا' },
    { name: 'نور', country: 'عُمان' },
    { name: 'رامي', country: 'لبنان' },
    { name: 'دينا', country: 'الجزائر' },
    { name: 'فهد', country: 'البحرين' },
    { name: 'ريم', country: 'العراق' },
    { name: 'نادر', country: 'مصر' },
    { name: 'حسين', country: 'السودان' },
    { name: 'لينا', country: 'السعودية' },
    { name: 'جود', country: 'الإمارات' },
    { name: 'مصطفى', country: 'الأردن' },
    { name: 'شهد', country: 'الكويت' },
    { name: 'باسل', country: 'سوريا' },
    { name: 'تقى', country: 'فلسطين' },
    { name: 'حازم', country: 'مصر' },
    { name: 'مها', country: 'السعودية' },
    { name: 'مهند', country: 'العراق' },
    { name: 'فارس', country: 'المغرب' },
    { name: 'سيف', country: 'تونس' },
    { name: 'حلا', country: 'قطر' },
    { name: 'إياد', country: 'الإمارات' },
    { name: 'جنان', country: 'البحرين' },
    { name: 'وليد', country: 'ليبيا' },
    { name: 'هاجر', country: 'الجزائر' },
    { name: 'دلال', country: 'عُمان' },
    { name: 'جواد', country: 'المغرب' },
    { name: 'ميس', country: 'لبنان' },
    { name: 'رهف', country: 'السعودية' },
    { name: 'صهيب', country: 'الأردن' },
    { name: 'أسيل', country: 'فلسطين' },
    { name: 'كمال', country: 'السودان' },
    { name: 'شروق', country: 'مصر' },
    { name: 'يزن', country: 'سوريا' },
    { name: 'أماني', country: 'الكويت' },
    { name: 'وائل', country: 'السعودية' },
    { name: 'ماريا', country: 'لبنان' },
    { name: 'سائد', country: 'فلسطين' },
    { name: 'جوري', country: 'الإمارات' },
    { name: 'طارق', country: 'قطر' },
    { name: 'معتصم', country: 'العراق' },
    { name: 'بتول', country: 'البحرين' },
    { name: 'عبدالله', country: 'عُمان' }
  ];

  currentIndex = 0;
  isVisible = true;

  private displayTimeout: any = null;
  private cycleTimeout: any = null;

  ngOnInit(): void {
    this.randomCycle();
  }

  private randomCycle(): void {
    // إظهار الإشعار
    this.isVisible = true;

    // اختيار سجل جديد
    this.currentIndex = (this.currentIndex + 1) % this.registrations.length;

    // وقت الظهور العشوائي بين 3-6 ثواني
    const visibleDuration = this.random(3000, 6000);

    this.displayTimeout = setTimeout(() => {
      this.isVisible = false;

      // وقت الانتظار العشوائي قبل الإشعار التالي (5-11 ثانية)
      const nextDelay = this.random(5000, 11000);

      this.cycleTimeout = setTimeout(() => {
        this.randomCycle();
      }, nextDelay);

    }, visibleDuration);
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  ngOnDestroy(): void {
    if (this.displayTimeout) clearTimeout(this.displayTimeout);
    if (this.cycleTimeout) clearTimeout(this.cycleTimeout);
  }
}
