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
      title: 'ماذا سوف تحصل داخل التحدي ؟',
      icon: 'Sparkles',
      text: 'تحدي مجاني مباشر راح أشرح فيه خطوة بخطوة كيف تبدأ تعمل دخل أونلاين بالتداول باستخدام الذكاء الاصطناعي بطريقة بسيطة وعملية'
    },
    {
      title: 'لمين هذا التحدي ؟',
      icon: 'Users',
      text: 'لأي شخص عنده رأس مال وحابب يتعلم كيف يبني مصدر دخل إضافي من خلال التداول قبل نهاية 2026',
    },
    {
      title: 'متى التحدي ؟',
      icon: 'CalendarDays',
      text: `يوم ${this.challengeDateTimeLabel} توقيت تركيا، لايف على برنامج الزوم`
    },
    {
      title: 'لماذا هذا التحدي ؟',
      icon: 'Trophy',
      text: 'لأنه لسه قدامك فرصة تعمل تغيير بوضعك المالي قبل نهاية 2026. ومع الذكاء الاصطناعي ونظامنا المتكامل، رح تتعرف على طريقة جديدة للتداول ممكن تساعدك تبدأ تبني مصدر دخل إضافي بدل ما تدخل سنة جديدة بنفس الوضع.',
    }
    ];
  }

  /** Formatted in Istanbul time, whatever the visitor's own timezone, because the card says "Turkey time". */
  private formatChallengeDateTime(timestamp: number): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: false
    }).formatToParts(new Date(timestamp));
    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    const weekdays: Record<string, string> = {
      Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء',
      Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت'
    };
    const hours24 = parseInt(get('hour'), 10) % 24;   // some engines print midnight as 24
    const hour12 = hours24 % 12 || 12;
    const period = hours24 >= 12 ? 'مساءً' : 'صباحاً';

    return `${weekdays[get('weekday')] || ''} ${get('day')}/${get('month')} الساعة ${hour12}:${get('minute')} ${period}`;
  }
}
