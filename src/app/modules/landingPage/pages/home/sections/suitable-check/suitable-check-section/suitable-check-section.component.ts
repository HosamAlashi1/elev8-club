import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-suitable-check-section',
  templateUrl: './suitable-check-section.component.html',
  styleUrls: ['./suitable-check-section.component.css']
})
export class SuitableCheckSectionComponent {
  @Input() onOpenRegistration!: () => void;

  suitable = [
    "مبتدئين يريدون خطة واضحة",
    "مشغولين يريدون مصدر دخل إضافي",
    "شخص جاد يلتزم 7 أيام لتعلم مهارة تحسّن دخله"
  ];

  notSuitable = [
    "أشخاص يريدون أرباح مضمونة 100%",
    "يريدون ثراء سريع بدون التزام",
    "مش ناويين يلتزموا يوم واحد"
  ];
}
