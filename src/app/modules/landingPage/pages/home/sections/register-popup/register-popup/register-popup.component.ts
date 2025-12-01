import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../../../../../services/firebase.service';
import { MetaPixelService } from '../../../../../../services/meta-pixel.service';
import { Version, Affiliate, Lead } from '../../../../../../../core/models';

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
export class RegisterPopupComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closePopup = new EventEmitter<void>();

  formData: FormData = {
    fullName: '',
    email: '',
    whatsapp: ''
  };

  private currentVersion: Version | null = null;
  private currentAffiliate: Affiliate | null = null;
  private affiliateCode: string | null = null;
  isSubmitting = false;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private route: ActivatedRoute,
    private metaPixel: MetaPixelService
  ) { }

  ngOnInit(): void {
    // قراءة ref code من الـ URL أو localStorage
    this.route.queryParams.subscribe(params => {
      this.affiliateCode = params['ref'] || localStorage.getItem('affiliateCode') || null;

      // جلب النسخة الحالية
      this.firebaseService.getCurrentVersion().subscribe(version => {
        this.currentVersion = version;
      });

      // جلب بيانات الأفلييت إذا كان موجود
      if (this.affiliateCode) {
        this.firebaseService.getAffiliateByCode(this.affiliateCode).subscribe(affiliate => {
          this.currentAffiliate = affiliate;
        });
      }
    });
  }

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

    if (this.isSubmitting) return;

    // التحقق من صحة البيانات
    if (!this.formData.fullName || !this.formData.email || !this.formData.whatsapp) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    if (!this.currentVersion) {
      alert('حدث خطأ، الرجاء المحاولة مرة أخرى');
      return;
    }

    this.isSubmitting = true;

    // إنشاء كائن Lead
    const leadData: any = {
      versionKey: this.currentVersion.key,
      fullName: this.formData.fullName,
      email: this.formData.email,
      phone: this.formData.whatsapp,
      step: 1,
      consent: true,
      createdAt: new Date().toISOString()
    };

    // ضيف affiliateKey فقط لو موجود
    if (this.currentAffiliate?.key) {
      leadData.affiliateKey = this.currentAffiliate.key;
    }

    // ضيف affiliateCode فقط لو موجود
    if (this.affiliateCode) {
      leadData.affiliateCode = this.affiliateCode;
    }

    // حفظ البيانات في Firebase
    this.firebaseService.addLead(leadData)
      .then(leadKey => {

        // Stage 4: Track Lead Submission
        this.metaPixel.trackLeadSubmission(leadKey, this.affiliateCode || undefined, {
          full_name: this.formData.fullName,
          email: this.formData.email,
          phone: this.formData.whatsapp
        });

        // إغلاق الـ popup
        this.onClose();

        // التوجيه لصفحة الأسئلة مع تمرير leadKey
        this.router.navigate(['/video-questions'], {
          queryParams: {
            lead: leadKey,
            ref: this.affiliateCode || undefined
          }
        });

        // إعادة تعيين النموذج
        this.formData = { fullName: '', email: '', whatsapp: '' };
        this.isSubmitting = false;
      })
      .catch(error => {
        console.error('Error creating lead:', error);
        alert('حدث خطأ أثناء التسجيل، الرجاء المحاولة مرة أخرى');
        this.isSubmitting = false;
      });
  }
}
