import { Component, OnDestroy, OnInit } from '@angular/core';
import { of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { ApiAdminService } from 'src/app/modules/services/api.admin.service';
import { ToastrsService } from 'src/app/modules/services/toater.service';
import { Lead } from 'src/app/core/models';
import Quill from 'quill';

interface CampaignRecipient {
  email: string;
  name: string;
}

const DEFAULT_EMAIL_SUBJECT = 'موعد Elev8 Challenge 0.3 ورابط مجموعة الواتساب';

const DEFAULT_EMAIL_CONTENT = `
  <div dir="rtl" style="text-align: right; line-height: 1.9; font-family: Arial, sans-serif;">
    <p>مرحباً {{الاسم}} 👋</p>
    <p>تم تسجيل بياناتك بنجاح في <strong>Elev8 Challenge 0.3</strong>.</p>
    <p>
      📅 <strong>موعد التحدي:</strong> 15 سبتمبر 2026<br>
      🕘 <strong>الساعة:</strong> 9:00 مساءً بتوقيت مصر<br>
      💻 <strong>عبر Zoom</strong>
    </p>
    <p><strong>لكن في خطوة مهمة جداً قبل موعد التحدي:</strong></p>
    <p>انضم إلى مجموعة الواتساب الخاصة بالتحدي 👇</p>
    <p>من خلال المجموعة رح نرسل لك:</p>
    <ul>
      <li>🔗 رابط الدخول إلى Zoom</li>
      <li>⏰ تذكيرات قبل بداية التحدي</li>
      <li>📢 جميع التحديثات المهمة</li>
      <li>🎯 التعليمات والتفاصيل الخاصة بالتحدي</li>
    </ul>
    <p><strong>اضغط هنا للانضمام إلى المجموعة:</strong></p>
    <p>
      <a href="https://chat.whatsapp.com/FE8WeRqJZtdBRCqz6Euw5d?s=cl&amp;p=i&amp;mlu=4"
         target="_blank"
         rel="noopener noreferrer"
         style="display: inline-block; padding: 12px 22px; border-radius: 8px; background: #25D366; color: #ffffff; text-decoration: none; font-weight: bold;">
        انضم إلى مجموعة الواتساب
      </a>
    </p>
    <p>⚠️ <strong>مهم:</strong> رابط Zoom والتحديثات الخاصة بالتحدي رح يتم إرسالها داخل مجموعة الواتساب، لذلك تأكد من انضمامك للمجموعة حتى ما يفوتك أي شيء.</p>
    <p>نشوفك يوم 15 سبتمبر الساعة 9 مساءً بتوقيت مصر 🔥</p>
    <p>فريق Elev8</p>
  </div>
`;

@Component({
  selector: 'app-email-campaign',
  templateUrl: './email-campaign.component.html',
  styleUrls: ['./email-campaign.component.css']
})
export class EmailCampaignComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  readonly namePlaceholder = '{{الاسم}}';

  // Email Form
  emailSubject = DEFAULT_EMAIL_SUBJECT;
  emailContent = DEFAULT_EMAIL_CONTENT;

  // Quill Config
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  // Leads Data
  allLeads: Lead[] = [];
  targetedLeadsCount = 0;
  
  // Filters
  filterStatus: 'all' | 'completed' | 'pending' = 'all';
  
  // Test Mode
  testMode = true;
  testEmail = 'hosam22.1.2003@gmail.com';
  testRecipientName = 'خليل';
  
  // Loading States
  isLoadingLeads = true;
  isSending = false;

  // Preview
  showPreview = false;

  constructor(
    private firebaseService: FirebaseService,
    private apiAdminService: ApiAdminService,
    private toastr: ToastrsService
  ) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeads(): void {
    this.isLoadingLeads = true;
    
    this.firebaseService.getCurrentVersion().pipe(
      switchMap(version => version ? this.firebaseService.getLeadsByVersion(version.key) : of(null)),
      takeUntil(this.destroy$)
    ).subscribe({
        next: leads => {
          if (!leads) {
            this.allLeads = [];
            this.updateTargetedCount();
            this.isLoadingLeads = false;
            return;
          }
          this.allLeads = leads;
          this.updateTargetedCount();
          this.isLoadingLeads = false;
        },
        error: () => {
          this.toastr.showError('Failed to load leads');
          this.isLoadingLeads = false;
        }
    });
  }

  updateTargetedCount(): void {
    this.targetedLeadsCount = this.getTargetedRecipients().length;
  }

  getTargetedRecipients(): CampaignRecipient[] {
    if (this.testMode) {
      return this.isValidEmail(this.testEmail)
        ? [{ email: this.testEmail.trim(), name: this.testRecipientName }]
        : [];
    }

    let filteredLeads = [...this.allLeads];

    if (this.filterStatus === 'completed') {
      filteredLeads = filteredLeads.filter(lead => lead.step === 2);
    } else if (this.filterStatus === 'pending') {
      filteredLeads = filteredLeads.filter(lead => lead.step !== 2);
    }

    const uniqueRecipients = new Map<string, CampaignRecipient>();
    filteredLeads.forEach(lead => {
      const email = (lead.email || '').trim();
      if (!this.isValidEmail(email)) return;

      const normalizedEmail = email.toLowerCase();
      if (!uniqueRecipients.has(normalizedEmail)) {
        uniqueRecipients.set(normalizedEmail, {
          email,
          name: (lead.fullName || '').trim()
        });
      }
    });

    return Array.from(uniqueRecipients.values());
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  canSend(): boolean {
    return (
      !this.isSending &&
      this.emailSubject.trim() !== '' &&
      this.emailContent.trim() !== '' &&
      this.targetedLeadsCount > 0
    );
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  get previewEmailContent(): string {
    const previewName = this.testMode ? this.testRecipientName : 'اسم المشترك';
    return this.emailContent.replace(
      /\{\{\s*(?:الاسم|name)\s*\}\}/gi,
      previewName
    );
  }

  sendCampaign(): void {
    if (!this.canSend()) {
      this.toastr.showWarning('Please fill in all required fields');
      return;
    }

    const recipientCount = this.testMode ? 1 : this.targetedLeadsCount;
    const message = this.testMode 
      ? `Are you sure you want to send this TEST email to ${this.testEmail}?`
      : `Are you sure you want to send this email to ${this.targetedLeadsCount} leads?`;

    if (!confirm(message)) {
      return;
    }

    this.isSending = true;

    const emailData = {
      subject: this.emailSubject,
      htmlContent: this.emailContent,
      recipients: this.getTargetedRecipients()
    };

    this.apiAdminService.sendBulkEmail(emailData).subscribe({
      next: (response: any) => {
        const successMessage = this.testMode
          ? `Test email sent successfully to ${this.testEmail}`
          : `Email sent successfully to ${this.targetedLeadsCount} leads`;
        this.toastr.showSuccess(successMessage);
        this.resetForm();
        this.isSending = false;
      },
      error: (error) => {
        console.error('Error sending emails:', error);
        this.toastr.showError('Failed to send emails. Please try again.');
        this.isSending = false;
      }
    });
  }

  resetForm(): void {
    this.emailSubject = DEFAULT_EMAIL_SUBJECT;
    this.emailContent = DEFAULT_EMAIL_CONTENT;
    this.filterStatus = 'all';
    this.showPreview = false;
  }

  // Helper to get plain text preview from HTML
  getPlainTextPreview(html: string, maxLength: number = 100): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
