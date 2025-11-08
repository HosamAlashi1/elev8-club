import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationListResponse, PortalNotification } from '../notification.model';
import { NotificationService } from '../notification.service';
import { NotificationContext } from '../notification-context';

declare const AOS: any;

@Component({
  selector: 'app-notifications-drawer',
  templateUrl: './notifications-drawer.component.html',
  styleUrls: ['./notifications-drawer.component.css']
})
export class NotificationsDrawerComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() context: NotificationContext = 'user';
  @Output() close = new EventEmitter<void>();

  @ViewChild('panelBody') panelBodyRef?: ElementRef<HTMLElement>;

  notifications: PortalNotification[] = [];
  isInitialLoading = false;
  isLoadingMore = false;

  // Drawer animation
  isAnimatingOut = false;
  panelOpen = false;

  // Pagination
  page = 1;
  pageSize = 20;
  totalRecords = 0;
  hasMore = true;

  // Animations for actions
  removingIds = new Set<number>();   // لإخفاء عنصر واحد بأنيميشن
  isHidingAll = false;               // لإخفاء الكل بأنيميشن
  readAllPulse = false;              // نبضة لطيفة بعد Read All

  constructor(
    private notificationsService: NotificationService,
    private router: Router
  ) {}

  // ================= Open / Close =================
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      const now = changes['isOpen'].currentValue;

      if (now) {
        this.isAnimatingOut = false;

        if (!this.notifications.length) {
          this.loadNotifications(true);
        } else {
          this.refreshAOS();
        }

        setTimeout(() => {
          this.panelOpen = true;
          this.triggerAOSInside();
        }, 10);
      } else {
        if (!this.isAnimatingOut && this.panelOpen) {
          this.startClosing();
        }
      }
    }
  }

  // ================= Load =================
  private loadNotifications(initial: boolean): void {
    if (initial) {
      this.isInitialLoading = true;
      this.notifications = [];
      this.page = 1;
      this.hasMore = true;
    } else {
      if (!this.hasMore || this.isLoadingMore || this.isInitialLoading) return;
      this.isLoadingMore = true;
    }

    this.notificationsService.getNotifications(this.page, this.context).subscribe({
      next: (payload: NotificationListResponse) => {
        const list = payload.data || [];
        const totalFromApi = payload.total_count || 0;

        if (totalFromApi > 0) this.totalRecords = totalFromApi;

        if (initial) {
          this.notifications = list;
          this.isInitialLoading = false;
        } else {
          this.notifications = [...this.notifications, ...list];
          this.isLoadingMore = false;
        }

        // hasMore logic
        if (this.totalRecords > 0) {
          this.hasMore = this.notifications.length < this.totalRecords;
        } else {
          this.hasMore = list.length === this.pageSize;
        }

        if (this.hasMore) this.page++;

        this.refreshAOS();
        this.triggerAOSInside();
      },
      error: () => {
        this.isInitialLoading = false;
        this.isLoadingMore = false;
        this.hasMore = false;
      }
    });
  }

  // ================= Scroll (infinite + AOS) =================
  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    const bottomOffset = 200;

    const reachedBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - bottomOffset;

    if (
      reachedBottom &&
      this.hasMore &&
      !this.isLoadingMore &&
      !this.isInitialLoading
    ) {
      this.loadNotifications(false);
    }

    this.triggerAOSInside(el);
  }

  private triggerAOSInside(container?: HTMLElement): void {
    if (typeof AOS === 'undefined') return;

    const host = container || this.panelBodyRef?.nativeElement;
    if (!host) return;

    const containerRect = host.getBoundingClientRect();
    const items = host.querySelectorAll<HTMLElement>('[data-aos]');

    items.forEach((el) => {
      if (el.classList.contains('aos-animate')) return;

      const rect = el.getBoundingClientRect();
      const isVisible =
        rect.top < containerRect.bottom - 40 &&
        rect.bottom > containerRect.top + 40;

      if (isVisible) {
        el.classList.add('aos-animate');
      }
    });
  }

  // ================= Actions =================
  openNotification(n: PortalNotification): void {
    if (!n.is_read) {
      this.markAsReadInternal(n);
    }

    if (n.link) {
      if (n.link.startsWith(window.location.origin) || n.link.startsWith('/')) {
        const relative = n.link.replace(window.location.origin, '');
        this.router.navigateByUrl(relative);
      } else {
        window.open(n.link, '_blank');
      }
    }
  }

  private markAsReadInternal(n: PortalNotification): void {
    this.notificationsService.markAsRead(n.id, this.context).subscribe({
      next: () => (n.is_read = true),
      error: () => {}
    });
  }

  hide(n: PortalNotification, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // أولاً: شغّل أنيميشن الإخفاء
    this.removingIds.add(n.id);

    this.notificationsService.hide(n.id, this.context).subscribe({
      next: () => {
        setTimeout(() => {
          this.notifications = this.notifications.filter(x => x.id !== n.id);
          this.removingIds.delete(n.id);
        }, 200); // مطابق لمدة الأنيميشن في CSS
      },
      error: () => {
        this.removingIds.delete(n.id); // رجّع الحالة لو فشل
      }
    });
  }

  markAllAsRead(): void {
    if (!this.notifications.length) return;

    this.notificationsService.readAll(this.context).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
        this.readAllPulse = true;

        // نبضة خفيفة ثم نطفيها
        setTimeout(() => {
          this.readAllPulse = false;
        }, 400);
      },
      error: () => {}
    });
  }

  hideAll(): void {
    if (!this.notifications.length) return;

    this.isHidingAll = true;

    this.notificationsService.hideAll(this.context).subscribe({
      next: () => {
        setTimeout(() => {
          this.notifications = [];
          this.hasMore = false;
          this.isHidingAll = false;
        }, 220); // يخلي الأنيميشن يخلص
      },
      error: () => {
        this.isHidingAll = false;
      }
    });
  }

  // ================= UI / Animation =================
  closeDrawer(): void {
    this.startClosing();
  }

  private startClosing(): void {
    if (this.isAnimatingOut) return;

    this.panelOpen = false;
    this.isAnimatingOut = true;

    setTimeout(() => {
      this.isAnimatingOut = false;
      this.close.emit();
    }, 280);
  }

  private refreshAOS(): void {
    if (typeof AOS === 'undefined') return;

    setTimeout(() => {
      if (typeof AOS.refreshHard === 'function') {
        AOS.refreshHard();
      } else if (typeof AOS.refresh === 'function') {
        AOS.refresh();
      }
    }, 50);
  }
}
