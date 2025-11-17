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
      title: 'أكاديمية من الصفر إلى الاحتراف',
      description: 'محتوى تعليمي شامل يأخذك خطوة بخطوة'
    },
    {
      icon: 'TrendingUp',
      title: 'توصيات تداول يومية جاهزة',
      description: 'صفقات محللة من خبراء السوق'
    },
    {
      icon: 'Bot',
      title: 'روبوت تداول بالذكاء الاصطناعي',
      description: 'تحليل ذكي ومساعدة في اتخاذ القرارات'
    },
    {
      icon: 'MessageCircle',
      title: 'دعم مباشر من المدربين',
      description: 'فريق متاح للإجابة على جميع استفساراتك'
    },
    {
      icon: 'Globe',
      title: 'مجتمع خاص للمتداولين',
      description: 'انضم لآلاف المتداولين وشارك الخبرات'
    },
    {
      icon: 'Trophy',
      title: 'جوائز مالية لأفضل المشاركين',
      description: 'تحفيزات ومكافآت للمتداولين المميزين'
    }
  ];

}
