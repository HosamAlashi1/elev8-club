import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FirebaseService } from 'src/app/modules/services/firebase.service';

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

  constructor(private readonly firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.firebaseService
      .getObject('settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: any) => {
        const startDate = this.parseDate(settings?.start_counter_date);

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
      text: 'لأي شخص يريد يبدأ يحقق دخل أونلاين من أي مكان بالعالم بدون يقضي سنوات حتى يصبح "خبير"وبرأس مال بسيط',
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
