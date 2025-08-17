import { Component, AfterViewInit, Input } from '@angular/core';
import { Process } from '../../../services/landing.service';

declare const AOS: any; // إن كنت محمّل AOS عالمشروع بشكل عالمي

@Component({
  selector: 'app-process',
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.css']
})
export class ProcessComponent implements AfterViewInit {
  @Input() title: string = 'Simple 4-Step Process';
  @Input() processes: Process[] = [
    { id: 1, step: '1', title: 'Order Testing Kit', description: 'Purchase your home testing kit through our app' },
    { id: 2, step: '2', title: 'Follow Instructions', description: 'Use the kit and capture images in the app' },
    { id: 3, step: '3', title: 'AI Analysis', description: 'Our AI system analyzes your test results' },
    { id: 4, step: '4', title: 'Get Results', description: 'Receive instant results and recommendations' }
  ];

  // لتطبيق تأخير بسيط متدرّج في AOS لكل عنصر
  aosDelay(index: number): number {
    return 150 * (index + 1);
  }

  // بعد الرسم نعمل refresh لـ AOS (اختياري لكن مفيد)
  ngAfterViewInit(): void {
    try {
      if (typeof AOS !== 'undefined' && AOS?.refresh) {
        AOS.refresh();
      }
    } catch {
      // ولا يهمك يا أبو باسم، لو AOS مش محمّل ما رح نكسر الصفحة
    }
  }

  trackById(_index: number, process: Process): number {
    return process.id;
  }
}
