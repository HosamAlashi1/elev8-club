import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-before-after-section',
  templateUrl: './before-after-section.component.html',
  styleUrls: ['./before-after-section.component.css']
})
export class BeforeAfterSectionComponent {
  @Input() onOpenRegistration!: () => void;

  beforeItems = [
    "ما تعرف ليش 95% من المتداولين يخسرون — وأنت مش عارف وين المشكلة",
    "تحاول تتعلم من يوتيوب ومحتوى عشوائي بدون نتيجة حقيقية",
    "ما عندك نظام واضح: لا تعرف وين تدخل، وين تخرج، وكيف تدير المخاطر",
    "قلقان من الفوائد الربوية (Swap) وما تعرف إذا التداول حلال أو لا",
    "تشوف ناس يربحون من التداول وتتساءل ليش ما تقدر تعمل نفس الشيء"
  ];

  afterItems = [
    "تعرف بالضبط ليش 95% يخسرون — وكيف تكون من الـ 5% الرابحين",
    "عندك نظام Elev8 2.0 المثبت الذي حقق $10,000,000+ منذ 2020",
    "جزء من مجتمع 50,000+ متداول ناجح يشاركك الخبرات يومياً",
    "تتداول Swap-Free بدون فوائد ربوية — حلال 100% وبراحة بال كاملة",
    "خطة تداول واضحة واستراتيجيات مثبتة تناسب مستواك سواء مبتدئ أو متوسط"
  ];
}
