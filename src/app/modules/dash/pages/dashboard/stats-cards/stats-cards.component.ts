import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-cards',
  templateUrl: './stats-cards.component.html',
  styleUrls: ['./stats-cards.component.css']
})
export class StatsCardsComponent {
  @Input() topAuthors: any[] = [];
  @Input() categoryChart: any = {};
  @Input() refundRate: { rate: string; change: string; changeColor: string } = {
    rate: '0.8%',
    change: '-0.3% vs last month',
    changeColor: '#16A34A'
  };

  // معالجة خطأ تحميل الصورة
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/img/blank.png';
    }
  }
}
