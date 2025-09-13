import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModernSelectService {
  private closeAllSubject = new Subject<string>();
  
  closeAll$ = this.closeAllSubject.asObservable();
  
  constructor() { }
  
  // دالة لإغلاق جميع الـ selects عدا المحدد
  closeAllExcept(excludeId: string): void {
    this.closeAllSubject.next(excludeId);
  }
  
  // دالة لإغلاق جميع الـ selects
  closeAll(): void {
    this.closeAllSubject.next('');
  }
}
