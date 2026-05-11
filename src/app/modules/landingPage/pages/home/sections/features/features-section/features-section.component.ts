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
      iconOffsetX: 0,
      iconOffsetY: 0,
      part: 'PART 01',
      title: 'ليش عالق بدوامة الراتب؟',
      description: 'ليش رغم شغلك ومحاولاتك لسه الدخل محدود وما في تطور حقيقي — تفهم السبب الحقيقي وتشوف الصورة بشكل مختلف.'
    },
    {
      icon: 'TrendingUp',
      iconSize: 13,
      iconOffsetX: 0,
      iconOffsetY: 0,
      part: 'PART 02',
      title: 'السر اللي غيّر حياة ناس عاديين',
      description: 'الفكرة اللي خلت أشخاص عاديين يوصلوا لدخل أعلى — تجربتي الشخصية وكيف طبّقتها على أرض الواقع.'
    },
    {
      icon: 'BriefcaseBusiness',
      iconSize: 13,
      iconOffsetX: 0,
      iconOffsetY: 0,
      part: 'PART 03',
      title: 'شو هو التداول وكيف ممكن تستفيد منه',
      description: 'شرح بسيط وواضح لعالم الفوركس وكيف ممكن يكون مصدر دخل إضافي إلك — والطريق المناسب حسب وقتك وميزانيتك.'
    },
    {
      icon: 'Globe',
      iconSize: 13,
      iconOffsetX: 0,
      iconOffsetY: 0,
      part: 'PART 04',
      title: 'تطبيق فعلي لأول صفقة',
      description: 'الدخول للسوق خطوة بخطوة وتنفيذ صفقة بشكل عملي — بهدف الوصول لأول نتيجة حقيقية إلك.'
    },
    {
      icon: 'Trophy',
      iconSize: 13,
      iconOffsetX: 0,
      iconOffsetY: 0.5,
      part: 'PART 05',
      title: 'فرصة خاصة للنهاية',
      description: 'الأشخاص اللي راح يكملوا للنهاية راح يكون في إلهم فرصة مختلفة — خطوة إضافية تسرّع طريقهم بشكل كبير.'
    },
    {
      icon: 'MessageCircle',
      iconSize: 13,
      iconOffsetX: 0,
      iconOffsetY: 0,
      part: 'BONUS',
      title: 'وحتى أوضحلك الصورة أكثر...',
      description: 'كل هذا راح أشرحه إلك بالكامل مجانًا 100% — في جلسة واحدة تغيّر مسارك المالي للأبد.'
    }
  ];

}
