import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, tap } from 'rxjs';
import { PortalNotification, NotificationListResponse } from './notification.model';
import { NotificationContext } from './notification-context';
import { ApiAdminService } from '../../services/api.admin.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private pageSize = 20;

  // unread count observable مشتركة مع الهيدر وغيره
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiAdmin: ApiAdminService
  ) { }

  private getBase(context: NotificationContext = 'user') {

         return this.apiAdmin.notifications;
  }

  getNotifications(page: number, context: NotificationContext = 'user') {
    const base = this.getBase(context);
    const url = `${base.List}?size=${this.pageSize}&page=${page}`;
    return this.http.get<{ data: NotificationListResponse }>(url).pipe(
      map(res => res.data)
    );
  }

  markAsRead(id: number, context: NotificationContext = 'user') {
    const base = this.getBase(context);
    return this.http.post<any>(base.read(id), {}).pipe(
      tap(() => this.decreaseUnreadLocally(1))
    );
  }

  hide(id: number, context: NotificationContext = 'user') {
    const base = this.getBase(context);
    return this.http.post<any>(base.hide(id), {});
  }

  readAll(context: NotificationContext = 'user') {
    const base = this.getBase(context);
    return this.http.post<any>(base.readAll, {}).pipe(
      tap(() => this.setUnreadLocally(0))
    );
  }

  hideAll(context: NotificationContext = 'user') {
    const base = this.getBase(context);
    return this.http.post<any>(base.hideAll, {});
  }

  refreshUnreadCount(context: NotificationContext = 'user') {
    const base = this.getBase(context);
    return this.http.get<any>(base.unread).pipe(
      tap(res => {
        // عدّل حسب شكل استجابة unread عندك
        const count =
          typeof res?.data === 'number'
            ? res.data
            : (res?.data?.total_unread ?? 0);
        this.unreadCountSubject.next(count || 0);
      })
    );
  }

  // ===== Helpers للعدّاد =====
  setUnreadLocally(count: number) {
    this.unreadCountSubject.next(Math.max(0, count));
  }

  decreaseUnreadLocally(delta: number) {
    const current = this.unreadCountSubject.value;
    this.unreadCountSubject.next(Math.max(0, current - delta));
  }
}
