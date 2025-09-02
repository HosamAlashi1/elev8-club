import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToastrsService {
  private baseConfig: Partial<IndividualConfig> = {
    timeOut: 3000,
    positionClass: 'toast-top-right',
    closeButton: true,
    progressBar: true,
    progressAnimation: 'decreasing',
    easeTime: 300,
    enableHtml: true, // نحتاجها عشان الأيقونات
  };

  constructor(private toast: ToastrService) {}

  showSuccess(message: string) {
    this.toast.success(
      `✅ ${message}`,
      '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast success-toast' }
    );
  }

  showError(message: string) {
    this.toast.error(
      `❌ ${message}`,
      '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast error-toast', timeOut: 5000 }
    );
  }

  showInfo(message: string) {
    this.toast.info(
      `ℹ️ ${message}`,
      '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast info-toast' }
    );
  }

  showWarning(message: string) {
    this.toast.warning(
      `⚠️ ${message}`,
      '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast warning-toast' }
    );
  }
}
