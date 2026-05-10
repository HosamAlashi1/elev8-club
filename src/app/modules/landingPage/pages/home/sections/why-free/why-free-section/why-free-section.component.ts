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
      title: 'شراكة مع شركة الوسيط (البروكر)',
      desc: 'عندنا شراكة مع شركة الوسيط — لما تفتح حساب تداول وتبدأ بالسوق، شركة الوسيط تأخذ عمولة صغيرة جداً على كل صفقة تتم. وهذا هو معنى "السبريد".'
    },
    {
      icon: 'CircleDollarSign',
      title: 'أنت تحقق 100% من أرباحك',
      desc: 'لا تدفع أي رسوم من جيبك الشخصي أبداً. العمولة تأخذها الشركة من شركة الوسيط مباشرة — مش منك. أرباحك تبقى كاملة لك.'
    },
    {
      icon: 'Target',
      title: 'مصالحنا مشتركة',
      desc: 'أنا مرتبط بشكل مباشر بنجاحك — كلما نجحت أنت وتداولت أكثر، نستفيد نحن أيضاً. هذا يعني إني محفّز 100% إنك تنجح فعلياً.'
    }
  ];
}
