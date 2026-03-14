import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { ApiAdminService } from 'src/app/modules/services/api.admin.service';
import { ToastrsService } from 'src/app/modules/services/toater.service';
import { Lead } from 'src/app/core/models';
import Quill from 'quill';

@Component({
  selector: 'app-email-campaign',
  templateUrl: './email-campaign.component.html',
  styleUrls: ['./email-campaign.component.css']
})
export class EmailCampaignComponent implements OnInit {
  // Email Form
  emailSubject = '';
  emailContent = '';

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

  loadLeads(): void {
    this.isLoadingLeads = true;
    
    this.firebaseService.getCurrentVersion().subscribe(version => {
      if (!version) {
        this.toastr.showError('No active version found');
        this.isLoadingLeads = false;
        return;
      }

      this.firebaseService.getLeadsByVersion(version.key).subscribe(
        leads => {
          this.allLeads = leads;
          this.updateTargetedCount();
          this.isLoadingLeads = false;
        },
        error => {
          this.toastr.showError('Failed to load leads');
          this.isLoadingLeads = false;
        }
      );
    });
  }

  updateTargetedCount(): void {
    let filteredLeads = [...this.allLeads];

    if (this.filterStatus === 'completed') {
      filteredLeads = filteredLeads.filter(lead => lead.step === 2);
    } else if (this.filterStatus === 'pending') {
      filteredLeads = filteredLeads.filter(lead => lead.step !== 2);
    }

    this.targetedLeadsCount = filteredLeads.length;
  }

  getTargetedLeadsEmails(): string[] {
    // إذا كان Test Mode مفعل، أرسل فقط لإيميل الاختبار
    if (this.testMode) {
      return [this.testEmail];
    }

    let filteredLeads = [...this.allLeads];

    if (this.filterStatus === 'completed') {
      filteredLeads = filteredLeads.filter(lead => lead.step === 2);
    } else if (this.filterStatus === 'pending') {
      filteredLeads = filteredLeads.filter(lead => lead.step !== 2);
    }

    return filteredLeads
      .filter(lead => lead.email && this.isValidEmail(lead.email))
      .map(lead => lead.email);
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
      recipients: this.getTargetedLeadsEmails()
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
    this.emailSubject = '';
    this.emailContent = '';
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
