import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-journey-section',
  templateUrl: './journey-section.component.html',
  styleUrls: ['./journey-section.component.css']
})
export class JourneySectionComponent {
  @Input() onOpenRegistration!: () => void;

  days = [
    { day: "اليوم الأول", title: "تعلم ما هو التداول من الصفر", description: "مقدمة شاملة لعالم التداول والأسواق المالية" },
    { day: "اليوم الثاني", title: "تعلم سوق الفوركس", description: "فهم سوق العملات وكيفية عمله" },
    { day: "اليوم الثالث", title: "كيفية تطبيق الصفقات الجاهزة", description: "استخدام التوصيات والصفقات المحللة" },
    { day: "اليوم الرابع", title: "التطبيق العملي للصفقات", description: "ممارسة عملية على حسابات تجريبية" },
    { day: "اليوم الخامس", title: "التطبيق العملي للصفقات", description: "مواصلة الممارسة وتطوير المهارات" },
    { day: "اليوم السادس", title: "الاستراتيجيات", description: "تعلم استراتيجيات التداول الناجحة" },
    { day: "اليوم السابع", title: "التطبيق العملي على حساب حقيقي", description: "البداية الحقيقية مع إدارة المخاطر" }
  ];

}
