import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-how-it-works-section',
  templateUrl: './how-it-works-section.component.html',
  styleUrls: ['./how-it-works-section.component.css']
})
export class HowItWorksSectionComponent {
  @Input() onOpenRegistration!: () => void;

  steps = [
    {
      num: '1',
      icon: 'GraduationCap',
      titleHtml: 'تفتح حساب وتحط فيه فلوس',
      descHtml: 'بأي تجارة بالعالم، أول خطوة إنك تفتح حساب بنك وتحط فيه رأس المال تبعك. وبالتداول نفس الفكرة تماما. أنت تفتح حساب تداول أونلاين، وتحط فيه المبلغ اللي بدك تبدأ فيه.'
    },
    {
      num: '2',
      icon: 'Laptop',
      titleHtml: 'يصير معك وسيلة تشتري وتبيع فيها',
      descHtml: 'بالتجارة العادية البنك بيعطيك: فيزا كارد، حساب، طريقة تدفع فيها. وبالتداول، التطبيق نفسه بصير هو أداتك للبيع والشراء. كل شيء يصير من خلال الجوال'
    },
    {
      num: '3',
      icon: 'TrendingUp',
      titleHtml: 'تختار شو بدك تشتري بهدف التجارة',
      descHtml: 'لما تنزل على السوق، بتختار السلعة اللي بدك تشتريها: ملابس، أكل، سمك، ذهب. خلينا نقول اخترت الذهب. ليش؟ لأنك تتوقع إن سعره راح يرتفع بالمستقبل'
    },
    {
      num: '4',
      icon: 'CircleDollarSign',
      titleHtml: 'تشتري وتبيع لتحقيق ربح',
      descHtml: 'إذا اشتريت الذهب، وبعد فترة ارتفع سعره فعلًا… تقدر تبيعه بسعر أعلى وتحقق فرق السعر كربح إلك. وهذا بالضبط هو التداول. لكن بدل ما تنزل على السوق، تحمل فلوس، تخزن ذهب، وتبيع بشكل تقليدي، كل شيء صار يتم أونلاين من خلال الجوال داخل الأسواق المالية العالمية بدقائق معدودة'
    }
  ];
}
