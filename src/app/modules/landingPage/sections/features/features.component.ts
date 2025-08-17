import { Component, AfterViewInit, Input } from '@angular/core';
import { Feature } from '../../../services/landing.service';

declare const AOS: any;

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements AfterViewInit {
  @Input() title: string = 'Key Features';
  @Input() features: Feature[] = [];

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }

  trackById(index: number, feature: Feature): number {
    return feature.id;
  }

  aosDelay(index: number): number {
    return 150 * (index + 1);
  }

  isIcon(imagePath: string): boolean {
    // تحقق إذا كان المسار يحتوي على أيقونة بدلاً من صورة
    return !!(imagePath && (imagePath.includes('fas ') || imagePath.includes('fab ') || imagePath.includes('fa-')));
  }

  getIconClass(imagePath: string): string {
    return imagePath || 'fas fa-star';
  }
}
