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
      icon: 'GraduationCap',
      titleHtml: 'تفتح <span class="hiw-text-accent">حساب</span> وتحط فيه <span class="hiw-text-accent">فلوس</span>',
      descHtml: 'بأي تجارة بالعالم، أول خطوة إنك تفتح <span class="hiw-text-strong">حساب</span> بنك وتحط فيه <span class="hiw-text-accent">رأس المال</span>. وبالتداول نفس الفكرة تماماً: أنت تفتح حساب تداول أونلاين وتحط فيه المبلغ اللي بدك تبدأ فيه.'
    },
    {
      num: '02',
      icon: 'Laptop',
      titleHtml: 'بصير معك وسيلة <span class="hiw-text-accent">للبيع</span> و<span class="hiw-text-accent">الشراء</span>',
      descHtml: 'التطبيق نفسه بصير هو أداتك للبيع والشراء، زي ما البنك بيعطيك فيزا كارد وطريقة تدفع فيها. كل شيء بصير معك <span class="hiw-text-strong">من خلال الجوال</span> وبشكل مباشر.'
    },
    {
      num: '03',
      icon: 'TrendingUp',
      titleHtml: 'تختار شو بدك تشتري <span class="hiw-text-accent">بهدف التجارة</span>',
      descHtml: 'لما تنزل على السوق، بتختار السلعة: ملابس، أكل، سمك، <span class="hiw-text-accent">ذهب</span>. خلينا نقول اخترت الذهب، لأنك تتوقع إن سعره <span class="hiw-text-strong">راح يرتفع</span> بالمستقبل.'
    },
    {
      num: '04',
      icon: 'CircleDollarSign',
      titleHtml: 'تشتري وتبيع <span class="hiw-text-accent">لتحقيق ربح</span>',
      descHtml: 'إذا اشتريت الذهب وبعد فترة ارتفع سعره، بتبيعه بسعر أعلى وتحقق <span class="hiw-text-accent">فرق السعر كربح</span>. كل شيء صار يتم أونلاين من خلال الجوال وبدقائق معدودة.'
    }
  ];
}
