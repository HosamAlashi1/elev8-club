import { Component, AfterViewInit } from '@angular/core';

declare const AOS: any; 

interface PreviewScreen {
  src: string;
  alt: string;
  delay: number; 
}

@Component({
  selector: 'app-app-preview',
  templateUrl: './app-preview.component.html',
  styleUrls: ['./app-preview.component.css']
})
export class AppPreviewComponent implements AfterViewInit {

  title = 'App Preview';

  screens: PreviewScreen[] = [
    { src: 'assets/img/app 1.svg', alt: 'Onboarding',      delay: 200 },
    { src: 'assets/img/app 2.svg', alt: 'Home Dashboard',  delay: 400 },
    { src: 'assets/img/app 3.svg', alt: 'Order New Kit',   delay: 600 },
    { src: 'assets/img/app 4.svg', alt: 'Take the Test',   delay: 800 },
  ];

  ngAfterViewInit(): void {
    try {
      if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh();
    } catch { 
      
    }
  }
}
