import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-challenge-review-section',
  templateUrl: './challenge-review-section.component.html',
  styleUrls: ['./challenge-review-section.component.css']
})
export class ChallengeReviewSectionComponent {
  @Input() onOpenRegistration!: () => void;

  reviewItems = [
    {
      title: 'ماذا ستحصل داخل التحدي؟',
      icon: 'Sparkles',
      text: 'تحدي مجاني مباشر، راح أشرح فيه خطوة بخطوة كيف تبدأ تعمل فلوس أونلاين بالتداول باستخدام الذكاء الاصطناعي بطريقة بسيطة وعملية'
    },
    {
      title: 'لمين هذا التحدي؟',
      icon: 'Users',
      text: 'أي شخص يريد يبدأ يحقق دخل أونلاين بدون ما يظهر وجهه أو يقضي سنوات حتى يصبح "خبير"'
    },
    {
      title: 'متى التحدي؟',
      icon: 'CalendarDays',
      text: 'يوم السبت 20 / 5، الساعة 9:00 مساءً بتوقيت مصر، مدة الجلسة حوالي ساعة'
    },
    {
      title: 'لماذا هذا التحدي؟',
      icon: 'Trophy',
      text: 'لأن الذكاء الاصطناعي خلق فرصة جديدة بالكامل، أصبح المبتدئين قادرين يبدأوا يبنوا دخل ممكن يغير حياتهم أونلاين'
    }
  ];
}
