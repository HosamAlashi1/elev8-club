import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LandingSettingsService } from 'src/app/modules/services/landing-settings.service';

@Component({
  selector: 'app-challenge-review-section',
  templateUrl: './challenge-review-section.component.html',
  styleUrls: ['./challenge-review-section.component.css']
})
export class ChallengeReviewSectionComponent implements OnInit, OnDestroy {
  @Input() onOpenRegistration!: () => void;

  private readonly destroy$ = new Subject<void>();
  private challengeDateTimeLabel = 'قريباً';

  reviewItems = this.buildReviewItems();

  constructor(private readonly landingSettings: LandingSettingsService) {}

  ngOnInit(): void {
    this.landingSettings
      .getStartCounterDate()
      .pipe(takeUntil(this.destroy$))
      .subscribe((startDate: number) => {
        if (!startDate) {
          return;
        }

        this.challengeDateTimeLabel = this.formatChallengeDateTime(startDate);
        this.reviewItems = this.buildReviewItems();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildReviewItems() {
    return [
    {
      title: 'ماذا ستحصل داخل التحدي؟',
      icon: 'Sparkles',
      text: 'تحدي مجاني مباشر راح أشرح فيه خطوة بخطوة كيف تبدأ تعمل فلوس أونلاين بالتداول باستخدام الذكاء الاصطناعي بطريقة بسيطة وعملية'
    },
    {
      title: 'لمين هذا التحدي؟',
      icon: 'Users',
      text: 'لأي شخص يريد يبدأ يحقق دخل أونلاين من أي مكان بالعالم بدون ما يقضي سنوات حتى يصبح "خبير"وبرأس مال بسيط',
    },
    {
      title: 'متى التحدي؟',
      icon: 'CalendarDays',
      text: `يوم ${this.challengeDateTimeLabel} (بتوقيت مصر)، مدة الجلسة حوالي ساعة`
    },
    {
      title: 'لماذا هذا التحدي؟',
      icon: 'Trophy',
      text: 'لأن الذكاء الاصطناعي خلق فرصة جديدة بالكامل أصبح المبتدئين قادرين يبنوا دخل أونلاين ممكن يغير حياتهم بالكامل',
    }
    ];
  }

  private formatChallengeDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const weekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const hours24 = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const hour12 = hours24 % 12 || 12;
    const period = hours24 >= 12 ? 'مساء' : 'صباحاً';

    return `${weekday} ${day}/${month} الساعة ${hour12}:${minutes} ${period}`;
  }
}
