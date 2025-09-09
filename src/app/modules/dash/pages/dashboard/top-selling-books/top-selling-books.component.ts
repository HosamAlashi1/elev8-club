import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-selling-books',
  templateUrl: './top-selling-books.component.html',
  styleUrls: ['./top-selling-books.component.css']
})
export class TopSellingBooksComponent {
  @Input() topSellingBooks: any[] = [];

  // حساب النسبة المئوية للتقدم
  getProgressPercentage(sold: number, target: number): number {
    return Math.min((sold / target) * 100, 100);
  }

  // تحديد لون الـ progress bar حسب الأداء
  getProgressColor(sold: number, target: number): string {
    const percentage = this.getProgressPercentage(sold, target);
    if (percentage >= 90) return '#10B981'; // أخضر للأداء الممتاز
    if (percentage >= 70) return '#F59E0B'; // أصفر للأداء الجيد
    if (percentage >= 50) return '#5BBDB7'; // تركوازي للأداء المتوسط
    return '#EF4444'; // أحمر للأداء الضعيف
  }

  // معالجة خطأ تحميل الصورة
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/img/blank.png';
    }
  }
}
