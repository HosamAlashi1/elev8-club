import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FileManagementComponent } from '../dash/shared/file-management/file-management.component';
import { UserProfileComponent } from '../dash/shared/user-profile/user-profile.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class PublicService {

  public numOfRows: number;
  public onlineStatus: Subject<boolean> = new Subject<boolean>();

  constructor(private modalService: NgbModal) {
    this.onlineStatus.next(navigator.onLine);
    window.addEventListener('online', () => {
      this.onlineStatus.next(true);
    });
    window.addEventListener('offline', () => {
      this.onlineStatus.next(false);
    });
  }

  private decryptStorage(): any {
    const encrypted = localStorage.getItem(`${environment.prefix}-data`);
    if (!encrypted) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, environment.cryptoKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('Error decrypting storage', e);
      return null;
    }
  }

  public getUserData() {
    const data = this.decryptStorage();
    return data ? data.user : null;
  }

  public getToken(): string | null {
    const data = this.decryptStorage();
    return data ? data.token : null;
  }

  public getPermissions(): string[] {
    const data = this.decryptStorage();
    return data ? data.permissions || [] : [];
  }

  public hasPermission(permission: string): boolean {
    const perms = this.getPermissions();
    return perms.includes(permission);
  }

  public hasAnyPermission(required: string[]): boolean {
    const perms = this.getPermissions();
    return required.some(p => perms.includes(p));
  }

  public hasAllPermissions(required: string[]): boolean {
    const perms = this.getPermissions();
    return required.every(p => perms.includes(p));
  }

  public getNumOfRows(innerHeight: number, rowHeight: number): number {
    this.numOfRows = Math.max(1, Math.floor((window.innerHeight - innerHeight) / rowHeight));
    return this.numOfRows;
  }

  openImage(title: string, path: string) {
    const modalRef = this.modalService.open(FileManagementComponent, { fullscreen: true, windowClass: 'modal-image' });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.path = path;
  }

  openProfile(userId: any) {
    const modalRef = this.modalService.open(UserProfileComponent, { centered: true });
    modalRef.componentInstance.userId = userId;
  }
}
