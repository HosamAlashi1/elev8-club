import { Component, AfterViewInit, ElementRef, NgZone, Input } from '@angular/core';

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
  @Input() testsCompleted: string = '10,000+';
  @Input() medicalCenters: string = '500+';
  @Input() accuracyRate: string = '99.9%';
  @Input() customerSupport: string = '24/7';

  metrics: MetricItem[] = [];
  tokens: Token[][] = [];

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngOnInit() {
    this.parseMetrics();
  }

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
        stack.style.transition = `transform 4000ms cubic-bezier(.2,.8,.2,1) ${delay}ms`;
        stack.style.transform = `translateY(${-target * h}px)`;
      });
    });
  }

  parseMetrics() {
    this.metrics = [
      this.parseMetricValue(this.testsCompleted, 'Tests Completed'),
      this.parseMetricValue(this.medicalCenters, 'Medical Centers'),
      this.parseMetricValue(this.accuracyRate, 'Accuracy Rate'),
      { display: this.customerSupport, label: 'Customer Support' }
    ];

    // 🔥 الحل: إعادة بناء tokens بعد ما تتعبى metrics
    this.tokens = this.metrics.map(m => this.formatToTokens(m));
  }

  parseMetricValue(value: string, label: string): MetricItem {
    if (!value) return { display: '', label };
    
    // Check if it contains numeric value
    const numMatch = value.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      const suffix = value.replace(numMatch[0], '');
      const decimals = (numMatch[1].split('.')[1] || '').length;
      return { value: num, suffix, label, decimals };
    }
    
    // If no numeric value, treat as display text
    return { display: value, label };
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
