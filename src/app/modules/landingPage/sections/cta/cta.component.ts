import { Component, AfterViewInit } from '@angular/core';

declare const AOS: any;

@Component({
  selector: 'app-cta',
  templateUrl: './cta.component.html',
  styleUrls: ['./cta.component.css']
})
export class CtaComponent implements AfterViewInit {

  title = 'Get Started Today';

  stores = [
    { src: 'assets/img/apple-store.svg',  alt: 'Download on the App Store', href: '#' },
    { src: 'assets/img/google-store.svg', alt: 'Get it on Google Play',     href: '#' }
  ];

  qrSrc = 'assets/img/QR.svg';

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }
}
