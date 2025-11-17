import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

interface FormData {
  fullName: string;
  email: string;
  whatsapp: string;
}

@Component({
  selector: 'app-register-popup',
  templateUrl: './register-popup.component.html',
  styleUrls: ['./register-popup.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100px) scale(0.9)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(100px) scale(0.9)' }))
      ])
    ])
  ]
})
export class RegisterPopupComponent {
  @Input() isOpen: boolean = false;
  @Output() closePopup = new EventEmitter<void>();

  formData: FormData = {
    fullName: '',
    email: '',
    whatsapp: ''
  };

  onClose(): void {
    this.closePopup.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    
    // Handle form submission
    console.log('Form submitted:', this.formData);
    alert('شكراً لتسجيلك! سنتواصل معك عبر واتساب خلال 24 ساعة.');
    
    // Reset form and close
    this.formData = { fullName: '', email: '', whatsapp: '' };
    this.onClose();
  }
}
