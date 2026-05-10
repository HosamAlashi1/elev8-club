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
      question: 'ماذا ستحصل داخل التحدي؟',
      icon: 'Gift',
      points: [
        'تحدي مجاني مباشر',
        'راح أشرح فيه كيف تبدأ تعمل فلوس أونلاين باستخدام الذكاء الاصطناعي بطريقة بسيطة وعملية'
      ]
    },
    {
      question: 'لمين هذا التحدي؟',
      icon: 'Users',
      points: [
        'لأي شخص يريد يبدأ يحقق دخل أونلاين...',
        'بدون ما يضطر يظهر وجهه',
        'أو يقضي سنوات حتى يصبح "خبير"'
      ]
    },
    {
      question: 'متى التحدي؟',
      icon: 'CalendarDays',
      points: [
        'يوم واحد فقط',
        'الساعة 9:00 مساءً (بتوقيت مصر)',
        'مدة الجلسة: حوالي ساعة'
      ]
    },
    {
      question: 'لماذا هذا التحدي؟',
      icon: 'Rocket',
      points: [
        'لأن الذكاء الاصطناعي خلق فرصة جديدة بالكامل...',
        'حتى للمبتدئين',
        'حتى يبدأوا يبنوا دخل ممكن يغيّر حياتهم أونلاين'
      ]
    }
  ];
}
