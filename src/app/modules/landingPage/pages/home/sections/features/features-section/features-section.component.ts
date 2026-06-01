import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-features-section',
  templateUrl: './features-section.component.html',
  styleUrls: ['./features-section.component.css'],
})
export class FeaturesSectionComponent {

  @Input() onOpenRegistration!: () => void;

  features = [
    {
      icon: 'GraduationCap',
      iconSize: 13,
      part: 'الجزء الاول',
      title: 'ليش عالق بدوامة الراتب؟',
      description: 'ليش رغم شغلك ومحاولاتك لسه الدخل محدود وما في تطور حقيقي. تفهم السبب الحقيقي وتشوف الصورة بشكل مختلف'
    },
    {
      icon: 'TrendingUp',
      iconSize: 13,
      part: 'الجزء الثاني',
      title: 'شو هو التداول وكيف ممكن تستفيد منه',
      description: 'شرح بسيط وواضح لعالم الفوركس وكيف ممكن يكون مصدر دخل إضافي إلك. والطريق المناسب حسب وقتك وميزانيتك'
    },
    {
      icon: 'Sparkles',
      iconSize: 13,
      part: 'الجزء الثالث',
      title: 'السر اللي غيّر حياة ناس عاديين',
      description: 'الفكرة اللي خلت أشخاص عاديين يوصلوا لدخل أعلى. وتجربتي الشخصية وكيف طبّقتها على أرض الواقع'
    },
    {
      icon: 'Globe',
      iconSize: 13,
      part: 'الجزء الرابع',
      title: 'تطبيق فعلي لأول صفقة',
      description: 'الدخول للسوق خطوة بخطوة وتنفيذ صفقة بشكل عملي بهدف الوصول لأول نتيجة'
    },
    {
      icon: 'Trophy',
      iconSize: 13,
      part: 'الجزء الخامس',
      title: 'فرصة خاصة للنهاية',
      description: 'الأشخاص اللي راح يكملوا للنهاية رح يكون في إلهم فرصة مختلفة. خطوة إضافية تسرّع طريقهم بشكل كبير'
    }
  ];

}
