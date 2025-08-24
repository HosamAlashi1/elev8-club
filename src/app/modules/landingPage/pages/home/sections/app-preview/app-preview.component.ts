import { Component, AfterViewInit, Input } from '@angular/core';
import { AppPreview } from '../../../../../services/landing.service';

declare const AOS: any; 

@Component({
  selector: 'app-app-preview',
  templateUrl: './app-preview.component.html',
  styleUrls: ['./app-preview.component.css']
})
export class AppPreviewComponent implements AfterViewInit {
  @Input() title: string = 'App Preview';
  @Input() appPreviews: AppPreview[] = [
    { id: 1, image: 'assets/img/app 1.svg' },
    { id: 2, image: 'assets/img/app 2.svg' },
    { id: 3, image: 'assets/img/app 3.svg' },
    { id: 4, image: 'assets/img/app 4.svg' }
  ];

  ngAfterViewInit(): void {
    try {
      if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh();
    } catch { 
    }
  }

  aosDelay(index: number): number {
    return 200 + (index * 200);
  }

  trackById(_index: number, preview: AppPreview): number {
    return preview.id;
  }

  onImageError(event: any, index: number): void {
    console.warn(`Failed to load app preview image at index ${index}:`, this.appPreviews[index]?.image);
    // يمكن إضافة صورة احتياطية هنا
    event.target.src = 'assets/img/placeholder-app.svg';
  }
}
