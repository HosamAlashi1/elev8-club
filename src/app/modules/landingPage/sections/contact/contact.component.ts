import { Component, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare const AOS: any;

interface ContactInfo {
  icon: string;   // Font Awesome class
  label: string;
  value: string;
  href?: string;  // tel: / mailto:
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements AfterViewInit {

  title = 'Contact Us';

  formModel = { name: '', email: '', message: '' };
  sending = false;

  info: ContactInfo[] = [
    { icon: 'fas fa-map-marker-alt', label: 'Address', value: '123 Medical Center Drive, Healthcare City, HC 12345' },
    { icon: 'fas fa-phone',          label: 'Phone',   value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
    { icon: 'fas fa-envelope',       label: 'Email',   value: 'contact@kidneytest.com', href: 'mailto:contact@kidneytest.com' }
  ];

  /** خريطة الشرق الأوسط بدون ماركر */
  private mapKey = 'AIzaSyDh2LLr-gtCTlFpvj10jtg-_W6gWP4LqCE'; // اللي عطيتني إياه
  private center = { lat: 26, lng: 44 };  // وسط الشرق الأوسط تقريبًا
  private zoom = 4;                       // زوم واسع
  safeMapUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    const url = `https://www.google.com/maps/embed/v1/view?key=${this.mapKey}&center=${this.center.lat},${this.center.lng}&zoom=${this.zoom}&maptype=roadmap`;
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }

  submit(form: NgForm) {
    if (!form.valid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.sending = true;
    setTimeout(() => { this.sending = false; form.resetForm(); }, 800);
  }
}
