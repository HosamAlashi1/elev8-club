import { Component, AfterViewInit } from '@angular/core';

declare const AOS: any; // إن كنت محمّل AOS عالمشروع بشكل عالمي

interface ProcessStep {
  id: number;         // رقم الخطوة (يُعرض داخل الدائرة)
  title: string;      // عنوان الخطوة
  description: string;// وصف مختصر
}

@Component({
  selector: 'app-process',
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.css']
})
export class ProcessComponent implements AfterViewInit {

  sectionTitle = 'Simple 4-Step Process';

  steps: ProcessStep[] = [
    { id: 1, title: 'Order Testing Kit',     description: 'Purchase your home testing kit through our app' },
    { id: 2, title: 'Follow Instructions',   description: 'Use the kit and capture images in the app' },
    { id: 3, title: 'AI Analysis',           description: 'Our AI system analyzes your test results' },
    { id: 4, title: 'Get Results',           description: 'Receive instant results and recommendations' }
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

  trackById(_index: number, step: ProcessStep): number {
    return step.id;
  }
}
