import { Component, AfterViewInit, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LandingService, ContactMessage } from '../../../../../services/landing.service';
import { ToastrService } from 'ngx-toastr';

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
export class ContactComponent implements OnInit, AfterViewInit {
  @Input() title: string = 'Contact Us';
  @Input() address: string = '123 Medical Center Drive, Healthcare City, HC 12345';
  @Input() phone: string = '+1 (555) 123-4567';
  @Input() email: string = 'contact@kidneytest.com';
  @Input() facebook: string = 'https://www.facebook.com/';
  @Input() twitter: string = 'https://www.twitter.com/';
  @Input() instagram: string = 'https://www.instagram.com/';
  @Input() linkedin: string = 'https://www.linkedin.com/';

  formModel = { name: '', email: '', message: '' };
  sending = false;
  formSubmitted = false; // متغير للتحكم في عرض رسائل الخطأ
  info: ContactInfo[] = [];

  ngOnInit(): void {
    // تحضير معلومات الاتصال مرة واحدة فقط
    this.updateContactInfo();
  }

  updateContactInfo(): void {
    this.info = [
      { icon: 'fas fa-map-marker-alt', label: 'Address', value: this.address },
      { icon: 'fas fa-phone', label: 'Phone', value: this.phone, href: `tel:${this.phone.replace(/\s|-|\(|\)/g, '')}` },
      { icon: 'fas fa-envelope', label: 'Email', value: this.email, href: `mailto:${this.email}` }
    ];
  }

  /** خريطة الشرق الأوسط بدون ماركر */
  private mapKey = 'AIzaSyDh2LLr-gtCTlFpvj10jtg-_W6gWP4LqCE'; // اللي عطيتني إياه
  private center = { lat: 26, lng: 44 };  // وسط الشرق الأوسط تقريبًا
  private zoom = 4;                       // زوم واسع
  safeMapUrl: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
    private landingService: LandingService,
    private toastr: ToastrService
  ) {
    const url = `https://www.google.com/maps/embed/v1/view?key=${this.mapKey}&center=${this.center.lat},${this.center.lng}&zoom=${this.zoom}&maptype=roadmap`;
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }

  submit(form: NgForm) {
    // تحديد أن المستخدم حاول الإرسال لإظهار رسائل الخطأ
    this.formSubmitted = true;

    // تحديد جميع الحقول كـ touched لإظهار رسائل الخطأ
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
    });

    // التحقق من صحة النموذج
    if (!form.valid) {
      this.toastr.warning('يرجى تصحيح الأخطاء في النموذج قبل الإرسال', 'بيانات غير صحيحة');
      return;
    }

    // التحقق الإضافي من البيانات
    if (this.formModel.name.trim().length < 2) {
      this.toastr.warning('الاسم يجب أن يكون أكثر من حرف واحد', 'اسم غير صحيح');
      return;
    }

    if (this.formModel.message.trim().length < 10) {
      this.toastr.warning('الرسالة يجب أن تكون أكثر من 10 أحرف', 'رسالة قصيرة');
      return;
    }

    // التحقق من صيغة البريد الإلكتروني
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.formModel.email)) {
      this.toastr.warning('صيغة البريد الإلكتروني غير صحيحة', 'بريد إلكتروني غير صحيح');
      return;
    }

    this.sending = true;

    const contactData: ContactMessage = {
      name: this.formModel.name.trim(),
      email: this.formModel.email.trim().toLowerCase(),
      message: this.formModel.message.trim()
    };

    this.landingService.sendContactMessage(contactData).subscribe({
      next: (response) => {
        console.log('Contact message sent successfully:', response);
        this.toastr.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 'تم الإرسال');
        
        // إعادة تعيين النموذج وإخفاء رسائل الخطأ
        form.resetForm();
        this.formModel = { name: '', email: '', message: '' };
        this.formSubmitted = false;
        this.sending = false;
      },
      error: (error) => {
        console.error('Error sending contact message:', error);
        this.toastr.error('عذراً، حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.', 'خطأ في الإرسال');
        this.sending = false;
      }
    });
  }
}
