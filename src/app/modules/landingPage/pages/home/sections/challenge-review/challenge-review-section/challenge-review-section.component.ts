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
      variant: 'content',
      icon: 'Gift',
      points: [
        '<strong>جلسة مباشرة</strong> ومجانية.',
        'شرح عملي يوضّح كيف تبدأ تستخدم الذكاء الاصطناعي بطريقة بسيطة.',
        'خطوات واضحة قابلة للتطبيق من أول يوم.'
      ]
    },
    {
      question: 'لمين هذا التحدي؟',
      variant: 'featured',
      icon: 'Users',
      points: [
        'لأي شخص يريد يبدأ يبني <strong>دخل أونلاين</strong> بشكل واضح ومنظّم.',
        'بدون ما يضطر يظهر وجهه أو يدخل في دوامة محتوى يومية.',
        'وبدون ما يقضي سنوات حتى يشعر أنه صار <strong>خبيراً</strong>.'
      ]
    },
    {
      question: 'متى التحدي؟',
      variant: 'schedule',
      icon: 'CalendarDays',
      points: [
        '<strong>يوم واحد فقط</strong>',
        '<strong>9:00 مساءً</strong> بتوقيت مصر',
        '<strong>حوالي ساعة</strong>'
      ]
    },
    {
      question: 'لماذا هذا التحدي؟',
      variant: 'support',
      icon: 'Rocket',
      points: [
        'لأن الذكاء الاصطناعي فتح <strong>فرصة جديدة</strong> حتى للمبتدئين.',
        'ولأن البداية الصحيحة اليوم ممكن تختصر عليك وقتاً طويلاً لاحقاً.'
      ]
    }
  ];
}
