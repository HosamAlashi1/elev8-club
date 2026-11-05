import { Component } from '@angular/core';

@Component({
  selector: 'app-audience-section',
  templateUrl: './audience-section.component.html',
  styleUrls: ['./audience-section.component.css'],
})
export class AudienceSectionComponent {
  cards = [
    {
      icon: 'TrendingUp',
      title: 'دخلك موجود لكن إله سقف',
      problem: 'بتحقق دخل لكن إذا بدك تزيده لازم تشتغل أكتر، أو تستنى زيادة بالراتب، أو تاخد شغل إضافي',
    },
    {
      icon: 'Home',
      title: 'عندك احتياجات وأهداف أكبر من دخلك الحالي',
      problem: 'بدك بيت، سيارة، سفرية أو ببساطة مستوى حياة أفضل، بس لما تحسبها على دخلك الحالي بتلاقي بدك سنوات لتعملها',
    },
    {
      icon: 'User',
      title: 'معتمد مادياً على مصدر دخل واحد',
      problem: 'عندك خوف إذا توقف شغلك كامل بوقف وبتدخل مشاكل كبيرة',
    },
    {
      icon: 'CircleDollarSign',
      title: 'عندك رأس مال بس مش عارف كيف تزوده',
      problem: 'ما عندك خطة واضحة كيف تزيد قيمة الفلوس اللي مدخرها ووين تستثمرها بشكل آمن',
    },
  ];
}
