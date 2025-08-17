import { Component, AfterViewInit, Input, OnInit } from '@angular/core';

declare const AOS: any;

@Component({
  selector: 'app-cta',
  templateUrl: './cta.component.html',
  styleUrls: ['./cta.component.css']
})
export class CtaComponent implements OnInit, AfterViewInit {
  @Input() title: string = 'Get Started Today';
  @Input() qrCodeImage: string = 'assets/img/QR.svg';
  @Input() iosAppLink: string = '#';
  @Input() androidAppLink: string = '#';

  stores: any[] = [];

  ngOnInit(): void {
    // تحضير البيانات مرة واحدة فقط - فقط الروابط المتوفرة
    this.stores = [];
    
    if (this.iosAppLink && this.iosAppLink !== '#') {
      this.stores.push({ src: 'assets/img/apple-store.svg', alt: 'Download on the App Store', href: this.iosAppLink });
    }
    
    if (this.androidAppLink && this.androidAppLink !== '#') {
      this.stores.push({ src: 'assets/img/google-store.svg', alt: 'Get it on Google Play', href: this.androidAppLink });
    }
  }

  get qrSrc() {
    return this.qrCodeImage;
  }

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }
}
