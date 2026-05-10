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
      num: '01',
      icon: 'bank',
      title: 'تفتح حساب وتحط فيه فلوس',
      desc: 'بأي تجارة بالعالم، أول خطوة إنك تفتح حساب بنك وتحط فيه رأس المال. وبالتداول نفس الفكرة تمامًا — أنت تفتح حساب تداول أونلاين، وتحط فيه المبلغ اللي بدك تبدأ فيه.',
      tag: 'الخطوة الأولى'
    },
    {
      num: '02',
      icon: 'mobile',
      title: 'يصير معك وسيلة للبيع والشراء',
      desc: 'التطبيق نفسه بصير هو أداتك للبيع والشراء — زي ما البنك بيعطيك فيزاكارد وطريقة تدفع فيها. كل شيء بصير من خلال الجوال.',
      tag: 'بضغطة واحدة'
    },
    {
      num: '03',
      icon: 'chart',
      title: 'تختار شو بدك تشتري بهدف التجارة',
      desc: 'لما تنزل على السوق، بتختار السلعة: ملابس، أكل، سمك، ذهب. خلينا نقول اخترت الذهب — لأنك تتوقع إن سعره راح يرتفع بالمستقبل.',
      tag: 'قرار ذكي'
    },
    {
      num: '04',
      icon: 'profit',
      title: 'تشتري وتبيع لتحقيق ربح',
      desc: 'إذا اشتريت الذهب وبعد فترة ارتفع سعره — تبيعه بسعر أعلى وتحقق فرق السعر كربح. كل شيء صار يتم أونلاين من خلال الجوال داخل الأسواق المالية العالمية بدقائق معدودة.',
      tag: 'النتيجة'
    }
  ];
}
