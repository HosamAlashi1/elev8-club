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
      { ...this.baseConfig }
    );
  }

  showError(message: string, title?: string) {
    this.toast.error(
      message,
      title || '',
      { ...this.baseConfig }
    );
  }

  showInfo(message: string, title?: string) {
    this.toast.info(
      message,
      title || '',
      { ...this.baseConfig }
    );
  }

  showWarning(message: string, title?: string) {
    this.toast.warning(
      message,
      title || '',
      { ...this.baseConfig }
    );
  }
}
