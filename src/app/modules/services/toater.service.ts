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
    enableHtml: true,
  };

  constructor(private toast: ToastrService) {}

  showSuccess(message: string, title?: string) {
    this.toast.success(
      message,
      title || '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast success-toast' }
    );
  }

  showError(message: string, title?: string) {
    this.toast.error(
      message,
      title || '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast error-toast', timeOut: 5000 }
    );
  }

  showInfo(message: string, title?: string) {
    this.toast.info(
      message,
      title || '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast info-toast' }
    );
  }

  showWarning(message: string, title?: string) {
    this.toast.warning(
      message,
      title || '',
      { ...this.baseConfig, toastClass: 'ngx-toastr custom-toast warning-toast' }
    );
  }
}
