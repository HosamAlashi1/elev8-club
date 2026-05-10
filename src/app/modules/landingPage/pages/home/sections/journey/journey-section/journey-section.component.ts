import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-journey-section',
  templateUrl: './journey-section.component.html',
  styleUrls: ['./journey-section.component.css']
})
export class JourneySectionComponent {
  @Input() onOpenRegistration!: () => void;

  days = [
    {
      day: "PART 01",
      title: "لماذا يخسر 95% من المتداولين؟",
      description: "نكشف الأسباب الحقيقية التي لا يتحدث عنها أحد — ولماذا معظم من يدخل التداول ينتهي بالخسارة رغم الجهد والمحاولة"
    },
    {
      day: "PART 02",
      title: "نظام التداول الرابح: الأسرار خطوة بخطوة",
      description: "المنهجية الكاملة التي يستخدمها المتداولون المحترفون — ستتعلمها لأول مرة بالكامل مع أمثلة حية على السوق الحقيقي"
    },
    {
      day: "PART 03",
      title: "نظام Elev8 2.0 — الكشف الحصري",
      description: "الكشف الكامل عن النظام المطوّر الذي حقق $10,000,000+ لأعضائنا منذ 2020 — نشاركه للمرة الأولى علناً"
    },
    {
      day: "PART 04",
      title: "استراتيجيات مثبتة: من المبتدئ للمحترف",
      description: "استراتيجيات تداول مجربة وموثّقة بنتائج حقيقية — تناسب كل مستوى سواء كنت مبتدئاً أو جربت قبل وفشلت"
    },
    {
      day: "PART 05",
      title: "تطبيق مباشر + جلسة أسئلة مفتوحة",
      description: "نطبّق كل ما تعلمناه على السوق الحقيقي مباشرة أمامك — ثم جلسة أسئلة وأجوبة مفتوحة مع المدربين للإجابة على كل أسئلتك"
    }
  ];
}
