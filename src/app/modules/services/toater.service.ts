import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToastrsService {
  constructor(private toast: ToastrService) {}

  Showsuccess(message: string) {
    this.toast.success(message, '', {
      timeOut: 4000,
      positionClass: 'toast-top-right'
    });
  }

  Showerror(message: string) {
    this.toast.error(message, '', {
      timeOut: 5000,
      positionClass: 'toast-top-right'
    });
  }

  Showinfo(message: string) {
    this.toast.info(message, '', {
      timeOut: 4000,
      positionClass: 'toast-top-right'
    });
  }

  ShowWarning(message: string) {
    this.toast.warning(message, '', {
      timeOut: 4500,
      positionClass: 'toast-top-right'
    });
  }
}
