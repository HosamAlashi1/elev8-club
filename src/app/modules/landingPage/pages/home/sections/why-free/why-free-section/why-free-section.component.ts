import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-why-free-section',
  templateUrl: './why-free-section.component.html',
  styleUrls: ['./why-free-section.component.css']
})
export class WhyFreeSectionComponent {
  @Input() onOpenRegistration!: () => void;

  reasons = [
    {
      icon: 'Handshake',
      titleHtml: '<span class="wf-inline-accent">شراكة واضحة</span> مع شركة الوسيط',
      descHtml: 'عندما تفتح حساب تداول وتبدأ فعلياً، شركة الوسيط تأخذ عمولة تشغيل صغيرة من السوق نفسه. أنت تدخل <span class="wf-inline-accent">بدون رسوم إضافية</span> من جيبك.'
    },
    {
      icon: 'CircleDollarSign',
      titleHtml: '<span class="wf-inline-accent">أرباحك تبقى لك</span>',
      descHtml: 'أنت لا تدفع أي تكلفة مباشرة لي. العمولة تأتي من شركة الوسيط، لذلك <span class="wf-inline-accent">أرباحك تبقى لك</span> بدون استنزاف إضافي.'
    },
    {
      icon: 'Target',
      titleHtml: '<span class="wf-inline-accent">مصالحنا مشتركة</span>',
      descHtml: 'أنا أستفيد فقط عندما تدخل السوق وتستمر بشكل صحيح، وهذا يجعل <span class="wf-inline-accent">مصالحنا مشتركة</span> ومرتبطة بنجاحك الحقيقي.'
    }
  ];
}
