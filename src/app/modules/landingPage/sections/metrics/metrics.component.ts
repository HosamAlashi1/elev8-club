import { Component, AfterViewInit, ElementRef, NgZone } from '@angular/core';

declare const AOS: any;

interface MetricItem {
  label: string;
  value?: number;   // قيمة رقمية (ثابتة)
  display?: string; // نص ثابت مثل 24/7
  suffix?: string;  // + أو %
  decimals?: number;// مثال 99.9 => 1
}

type Token =
  | { kind: 'digit'; digit: number }
  | { kind: 'char'; ch: string };

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css']
})
export class MetricsComponent implements AfterViewInit {

  metrics: MetricItem[] = [
    { value: 10000, suffix: '+', label: 'Tests Completed' },
    { value: 500,   suffix: '+', label: 'Medical Centers' },
    { value: 99.9,  suffix: '%', label: 'Accuracy Rate', decimals: 1 },
    { display: '24/7',           label: 'Customer Support' }
  ];

  /** كل ميتريك يتحوّل لمصفوفة Tokens (أرقام منفصلة + أحرف مثل , . % + /) */
  tokens: Token[][] = this.metrics.map(m => this.formatToTokens(m));

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    // تحديث AOS
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}

    // ابدأ الأنيميشن عند دخول السكشن
    const root = this.host.nativeElement;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        root.classList.add('in-view');  // لتشغيل Pop-in/shine إن وُجد
        this.zone.runOutsideAngular(() => this.animateFlip());
        io.disconnect();
      }
    }, { threshold: 0.25 });
    io.observe(root);
  }

  /** يشغّل الفليب لكل خانة رقمية */
  private animateFlip(): void {
    const root = this.host.nativeElement;
    const cols = root.querySelectorAll<HTMLElement>('.flip-col');

    cols.forEach(col => {
      const target = parseInt(col.dataset.target || '0', 10);
      const mi = parseInt(col.dataset.mindex || '0', 10);
      const ti = parseInt(col.dataset.tindex || '0', 10);

      const stack = col.querySelector<HTMLElement>('.digits');
      const sample = col.querySelector<HTMLElement>('.digit');
      if (!stack || !sample || Number.isNaN(target)) return;

      const h = sample.offsetHeight; // ارتفاع رقم واحد
      const delay = mi * 150 + ti * 45; // Stagger: حسب الميتريك ثم الخانة

      // بدء من الصفر
      stack.style.transform = 'translateY(0)';
      stack.style.transition = 'none';

      requestAnimationFrame(() => {
        // الانتقال إلى الرقم الهدف
        stack.style.transition = `transform 1200ms cubic-bezier(.2,.8,.2,1) ${delay}ms`;
        stack.style.transform = `translateY(${-target * h}px)`;
      });
    });
  }

  private formatToTokens(m: MetricItem): Token[] {
    const s = m.display ?? (this.formatNumber(m.value ?? 0, m.decimals ?? 0) + (m.suffix ?? ''));
    const out: Token[] = [];
    for (const ch of s) {
      if (/\d/.test(ch)) out.push({ kind: 'digit', digit: parseInt(ch, 10) });
      else               out.push({ kind: 'char',  ch });
    }
    return out;
  }

  private formatNumber(n: number, decimals: number): string {
    const fixed = n.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${withCommas}.${decPart}` : withCommas;
  }
}
