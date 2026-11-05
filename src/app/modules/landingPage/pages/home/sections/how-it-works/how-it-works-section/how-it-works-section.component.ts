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
      title: 'تفتح حساب وتحط فيه فلوس',
      paragraphs: [
        'زي ما بتحتاج رأس مال عشان تبدأ أي تجارة، بالتداول بتفتح حساب أونلاين وبتحط فيه المبلغ اللي بدك تبدأ فيه.'
      ]
    },
    {
      num: '2',
      title: 'تختار شو بدك تتاجر فيه',
      paragraphs: [
        'بالسوق العادي ممكن تختار تشتري ذهب أو ملابس أو أكل. بالتداول بتقدر تختار العملات أو الذهب أو الأسهم.'
      ]
    },
    {
      num: '3',
      title: 'تقرر إذا السعر رح يرتفع أو ينخفض',
      paragraphs: [
        'مثلاً، إذا نزلت على السوق واشتريت ذهب لأنك متوقع سعره يرتفع، بالتداول بتعمل نفس الفكرة، لكن أونلاين. وممكن كمان تتوقع إن السعر ينخفض وتفتح صفقة بيع.'
      ]
    },
    {
      num: '4',
      title: 'تربح أو تخسر حسب توقعك',
      paragraphs: [
        'إذا كان توقعك صح وتحرك السعر بالاتجاه اللي توقعته، ممكن تحقق ربح. أما إذا تحرك السعر عكس توقعك، ممكن تتعرض للخسارة.'
      ]
    }
  ];
}
