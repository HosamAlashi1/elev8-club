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
      titleHtml: 'شركة الوساطة تأخذ عمولة صغيرة جدًا',
      descHtml: 'لما تفتح حساب تداول وتبدأ تستخدم المنصة، شركة الوساطة تأخذ عمولة صغيرة جدًا على كل عملية بيع أو شراء تتم داخل السوق. تماما مثل محل الذهب… لما تشتري أو تبيع ذهب، المحل يضيف هامش بسيط جدًا على السعر. ونفس الفكرة موجودة هنا.'
    },
    {
      icon: 'CircleDollarSign',
      titleHtml: 'أنت تحتفظ 100% من أرباحك',
      descHtml: 'لكن المهم جدًا تفهم: أنت تحتفظ 100% من أرباحك داخل حسابك. ولا يتم أخذ أي نسبة من أرباحك الشخصية.'
    },
    {
      icon: 'Target',
      titleHtml: 'العمولة من شركة الوساطة نفسها مش منك',
      descHtml: 'العمولة تكون من شركة الوساطة نفسها مش منك ، وهي غالبا مجرد أجزاء بسيطة من الدولار على كل صفقة.'
    }
  ];
}
