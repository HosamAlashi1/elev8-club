import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { Subject, takeUntil, take } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface GeneralSettings {
  id?: string;
  sender_email: string;
  sender_name: string;
  sendgrid_key: string;
  start_counter_date: number;
  whatsapp_link: string;
}

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.css']
})
export class GeneralSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  settings: GeneralSettings = {
    id: undefined,
    sender_email: '',
    sender_name: '',
    sendgrid_key: '',
    start_counter_date: 0,
    whatsapp_link: ''
  };
  
  isLoading = true;
  isSaving = false;
  
  // For datetime-local input
  startCounterDateLocal = '';

  constructor(
    private firebaseService: FirebaseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSettings(): void {
    this.isLoading = true;

    this.firebaseService.getObject('settings')
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe({
        next: (settings: any) => {
          console.log('Loaded settings:', settings);

          if (settings) {
            this.settings = {
              id: 'settings',
              sender_email: settings.sender_email || '',
              sender_name: settings.sender_name || '',
              sendgrid_key: settings.sendgrid_key || '',
              start_counter_date: this.parseDate(settings.start_counter_date),
              whatsapp_link: settings.whatsapp_link || ''
            };

            // تحويل الـ timestamp إلى تنسيق datetime-local
            if (this.settings.start_counter_date) {
              this.startCounterDateLocal =
                this.timestampToDatetimeLocal(this.settings.start_counter_date);
            }
          } else {
            this.toastr.warning('Settings not found');
          }

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading settings:', err);
          this.toastr.error('Failed to load settings');
          this.isLoading = false;
        }
      });
  }
  
  private parseDate(dateValue: any): number {
    if (!dateValue) return 0;
    
    // If it's already a number (timestamp)
    if (typeof dateValue === 'number') return dateValue;
    
    // If it's a string date format
    if (typeof dateValue === 'string') {
      const timestamp = new Date(dateValue).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    }
    
    return 0;
  }

  saveSettings(): void {
    // Validation
    if (!this.settings.sender_email || !this.settings.sender_name) {
      this.toastr.warning('Sender Email and Sender Name are required');
      return;
    }

    // Convert datetime-local to timestamp
    if (this.startCounterDateLocal) {
      this.settings.start_counter_date =
        this.datetimeLocalToTimestamp(this.startCounterDateLocal);
    }

    this.isSaving = true;
    
    console.log('Saving settings:', this.settings);
    
    // Update the entire settings object
    const updateData = {
      sender_email: this.settings.sender_email,
      sender_name: this.settings.sender_name,
      sendgrid_key: this.settings.sendgrid_key || '',
      start_counter_date: this.settings.start_counter_date || 0,
      whatsapp_link: this.settings.whatsapp_link || ''
    };
    
    this.firebaseService.updateObject('settings', updateData)
      .then(() => {
        console.log('Settings saved successfully');
        this.toastr.success('Settings updated successfully');
        this.isSaving = false;
        // Reload settings to confirm
        this.loadSettings();
      })
      .catch(err => {
        console.error('Error updating settings:', err);
        this.toastr.error('Failed to update settings: ' + (err.message || 'Unknown error'));
        this.isSaving = false;
      });
  }

  private timestampToDatetimeLocal(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private datetimeLocalToTimestamp(datetimeLocal: string): number {
    return new Date(datetimeLocal).getTime();
  }
}
