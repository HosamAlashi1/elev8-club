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
  @Input() address: string = '';
  @Input() phone: string = '';
  @Input() email: string = '';
  @Input() business_hours: string = '';

  formModel = { name: '', email: '', message: '' };
  sending = false;
  formSubmitted = false; // flag to control validation error display
  info: ContactInfo[] = [];
  businessHoursArray: string[] = [];

  private mapKey = 'AIzaSyDh2LLr-gtCTlFpvj10jtg-_W6gWP4LqCE'; // your provided API key
  private center = { lat: 26, lng: 44 }; // Middle East center
  private zoom = 4;                      // wide zoom
  safeMapUrl: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
    private landingService: LandingService,
    private toastr: ToastrService
  ) {
    const url = `https://www.google.com/maps/embed/v1/view?key=${this.mapKey}&center=${this.center.lat},${this.center.lng}&zoom=${this.zoom}&maptype=roadmap`;
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
    this.updateContactInfo();

    if (this.business_hours) {
      // Split by newline or semicolon
      this.businessHoursArray = this.business_hours
        .split(/\r?\n|;/)
        .map(x => x.trim())
        .filter(x => x.length > 0);
    }
  }

  updateContactInfo(): void {
    this.info = [
      { icon: 'fas fa-map-marker-alt', label: 'Address', value: this.address },
      { icon: 'fas fa-phone', label: 'Phone', value: this.phone, href: `tel:${this.phone.replace(/\s|-|\(|\)/g, '')}` },
      { icon: 'fas fa-envelope', label: 'Email', value: this.email, href: `mailto:${this.email}` }
    ];
  }

  ngAfterViewInit(): void {
    try {
      if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh();
    } catch { }
  }

  submit(form: NgForm) {
    this.formSubmitted = true;

    // Mark all controls as touched to show validation messages
    Object.values(form.controls).forEach(control => control.markAsTouched());

    // Validate form
    if (!form.valid) {
      this.toastr.warning('Please fix the form errors before submitting.', 'Invalid Data');
      return;
    }

    if (this.formModel.name.trim().length < 2) {
      this.toastr.warning('Name must be at least 2 characters long.', 'Invalid Name');
      return;
    }

    if (this.formModel.message.trim().length < 10) {
      this.toastr.warning('Message must be at least 10 characters long.', 'Too Short');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.formModel.email)) {
      this.toastr.warning('Invalid email format.', 'Invalid Email');
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
        this.toastr.success('Your message has been sent successfully! We will contact you soon.', 'Message Sent');

        // Reset form and flags
        form.resetForm();
        this.formModel = { name: '', email: '', message: '' };
        this.formSubmitted = false;
        this.sending = false;
      },
      error: (error) => {
        console.error('Error sending contact message:', error);
        this.toastr.error('Sorry, an error occurred while sending your message. Please try again later.', 'Sending Failed');
        this.sending = false;
      }
    });
  }
}
