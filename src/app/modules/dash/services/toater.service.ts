import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';

@Injectable({
  providedIn: 'root',
})
export class ToastrsService {
  constructor(private toast: HotToastService) {}

  Showsuccess(message: string) {
    this.toast.success(message, {
      duration: 4000,
      position: 'top-right'
    });
  }

  Showerror(message: string) {
    this.toast.error(message, {
      duration: 5000,
      position: 'top-right'
    });
  }

  Showinfo(message: string) {
    this.toast.info(message, {
      duration: 4000,
      position: 'top-right'
    });
  }

  ShowWarning(message: string) {
    this.toast.warning(message, {
      duration: 4500,
      position: 'top-right'
    });
  }
}
