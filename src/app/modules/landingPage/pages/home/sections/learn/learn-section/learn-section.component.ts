import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-learn-section',
  templateUrl: './learn-section.component.html',
  styleUrls: ['./learn-section.component.css']
})
export class LearnSectionComponent {
  @Input() onOpenRegistration!: () => void;

  parts = [
    {
      part: 'الجزء الأول',
      title: 'ليش دخلك لسه محدود؟',
      description:
        'ليش رغم شغلك وتعبك، دخلك لسه عند نفس المستوى؟ رح تفهم شو اللي بخلي دخلك محدود، وليش زيادة الجهد مش دايماً معناها زيادة الدخل.'
    },
    {
      part: 'الجزء الثاني',
      title: 'مثلث الثراء ومبدأ الـ Leverage',
      description:
        'رح تتعرف على مبدأ الـ Leverage، وكيف ممكن تستفيد من وقتك ومهاراتك والأنظمة الموجودة حولك حتى تتجاوز حدود دخلك الحالي.'
    },
    {
      part: 'الجزء الثالث',
      title: 'كيف تطبّق الـ Leverage من خلال التداول؟',
      description:
        'رح تتعرف على التداول كواحدة من الطرق اللي ممكن تطبّق فيها مبدأ الـ Leverage، وكيف تستفيد من الذكاء الاصطناعي وخبرة المحترفين بدل ما تعتمد على نفسك بكل خطوة.'
    },
    {
      part: 'الجزء الرابع',
      title: 'فرصتك لتطبيق النظام',
      description:
        'رح أشرحلك نظامنا المتكامل بالتداول، وكيف ممكن يساعدك تطبّق اللي تعلمته وتشتغل باتجاه إضافة 1000 دولار شهرياً إلى حسابك البنكي قبل نهاية 2026.'
    }
  ];
}
