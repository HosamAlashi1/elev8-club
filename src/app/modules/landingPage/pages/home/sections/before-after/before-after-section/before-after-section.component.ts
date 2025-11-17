import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-before-after-section',
  templateUrl: './before-after-section.component.html',
  styleUrls: ['./before-after-section.component.css']
})
export class BeforeAfterSectionComponent {
    @Input() onOpenRegistration!: () => void;
  
  beforeItems = [
    "تضيع وقتك في فيديوهات عشوائية",
    "ما عندك خطة تداول",
    "بتخاف من الخسارة",
    "بتحس السوق ضدك"
  ];

  afterItems = [
    "عندك خطة واضحة",
    "تدخل بثقة",
    "تفهم السوق فعلياً",
    "جزء من مجتمع ناجح يدعمك"
  ];


}
