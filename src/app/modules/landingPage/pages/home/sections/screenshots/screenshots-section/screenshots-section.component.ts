import { Component } from '@angular/core';

@Component({
  selector: 'app-screenshots-section',
  templateUrl: './screenshots-section.component.html',
  styleUrls: ['./screenshots-section.component.css'],
})
export class ScreenshotsSectionComponent {
  activeIndex = 0;
  isAnimating = false;
  slideDirection: 'next' | 'prev' = 'next';

  private animationTimer?: ReturnType<typeof setTimeout>;

  /**
   * صور الكاروسيل. حالياً صور مؤقتة من النظام (placeholder).
   * استبدلها بسكرين شوتاتك الحقيقية لاحقاً — بنفس الترتيب.
   * يفضّل 7 صور أو أكثر حتى يصير الـ wrap خلف الكواليس بدون قفزة.
   */
  readonly slides: string[] = [
    'assets/images/anima-home/shots-screenshot.png',
    'assets/images/anima-home/shots-screenshot.png',
    'assets/images/anima-home/shots-screenshot.png',
    'assets/images/anima-home/shots-screenshot.png',
    'assets/images/anima-home/shots-screenshot.png',
    'assets/images/anima-home/shots-screenshot.png',
    'assets/images/anima-home/shots-screenshot.png',
  ];

  /** نصوص الكروت الأربعة أسفل السكشن — بترتيب DOM يسار ← يمين (نفس الأنيما). */
  readonly cards: string[] = [
    'و بنهاية المكالمة ، رح يكون عندك وضوح كامل عن كيف تبدأ التداول بدون عشوائية.',
    'وخليني اقلك انه قدرت من خلال المجال هذا أحقق آلاف الدولارات، وأساعد ناس ألاف الشباب يبدؤوا أول خطوة إلهم بشكل صحيح',
    'خلال جلسة مدتها ساعة تقريبًا، وفي آخر ربع ساعة … راح نطبّق التداول بشكل مباشر live حتى تشوف الخطوات بعينك وتفهم كيف تبدأ بنفسك',
    'يوم 20/5، راح أفرجيك بشكل مباشر، قدام الكاميرا، خطوة بخطوة… كيف ناس كثير قدروا يبدؤوا بالتداول بالطريقة الصح وكيف أنت كمان تقدر تعمل نفس الشي',
  ];

  /** المسافة (slot) للصورة عن المركز: 0 = الوسط، ±1 و ±2 جوانب، ±3 مخبّأة (buffer) */
  offsetFor(index: number): number {
    const n = this.slides.length;
    let d = (((index - this.activeIndex) % n) + n) % n; // 0..n-1
    if (d > n / 2) {
      d -= n;
    }
    return d;
  }

  nextSlide(): void {
    this.go(1, 'next');
  }

  prevSlide(): void {
    this.go(-1, 'prev');
  }

  trackByIndex(index: number): number {
    return index;
  }

  private go(step: number, direction: 'next' | 'prev'): void {
    this.slideDirection = direction;
    this.activeIndex =
      (this.activeIndex + step + this.slides.length) % this.slides.length;
    this.isAnimating = true;

    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    this.animationTimer = setTimeout(() => {
      this.isAnimating = false;
    }, 520);
  }
}
