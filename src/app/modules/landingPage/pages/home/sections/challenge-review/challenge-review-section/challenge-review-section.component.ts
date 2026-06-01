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
      question: 'لمين هذا التحدي؟',
      variant: 'featured',
      icon: 'Users',
      points: [
        'لأي شخص يريد يبدأ يحقق دخل أونلاين…',
        'بدون ما يضطر يظهر وجهه',
        'أو يقضي سنوات حتى يصبح “خبير”'
      ]
    },
    {
      question: 'متي التحدي ؟',
      variant: 'schedule',
      icon: 'CalendarDays',
      points: [
        'يوم السبت 20 / 5',
        'الساعة 9:00 مساء (بتوقيت مصر 🇪🇬)',
        'مدة الجلسة: حوالي ساعة'
      ]
    },
    {
      question: 'ماذا ستحصل داخل التحدي؟',
      variant: 'content',
      icon: 'Gift',
      points: [
        'تحدي مجاني مباشر ،',
        'راح أشرح فيه خطوة بخطوة',
        'كيف تبدأ تعمل فلوس اونلاين بالتداول باستخدام الذكاء الاصطناعي بطريقة بسيطة وعملية'
      ]
    },
    {
      question: 'لماذا هذا التحدي ؟',
      variant: 'support',
      icon: 'Rocket',
      points: [
        'لأن الذكاء الاصطناعي خلق فرصة جديدة بالكامل…',
        'حتى للمبتدئين،',
        'حتى يبدؤوا يبنوا دخل ممكن يغيّر حياتهم أونلاين'
      ]
    }
  ];
}
