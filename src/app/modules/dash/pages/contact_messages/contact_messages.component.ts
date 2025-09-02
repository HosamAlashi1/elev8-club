import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-contact_messages',
  templateUrl: './contact_messages.component.html',
  styleUrls: ['./contact_messages.component.css'],
})
export class ContactMessagesComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  contactMessages: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  unreadCount = 0;

  constructor(
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal,
    private api: ApiService,
    private httpService: HttpService,
    private router: Router
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
  }

  ngOnInit(): void {
    this.loadData();
    this.getUnreadCount();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });

    // استمع لتغيير الصفحة لتحديث العداد
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navigationEvent = event as NavigationEnd;
      if (navigationEvent.url === '/dashboard/contactMessages') {
        // انتظر قليلاً ثم حدث البيانات لضمان تنفيذ API من السايدبار أولاً
        setTimeout(() => {
          this.getUnreadCount();
          this.list(this.page);
        }, 100);
      }
    });
  }

  loadData(): void {
    this.list(this.page);
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);
    const payload = {
      perPage: this.size,
      page: this.page,
      search: this.searchText.trim()
    };

    const url = `${this.api.contactMessages.list}`;
    this.httpService.list(url, payload, 'contactMessagesList').subscribe({
      next: (res) => {
        if (res?.status && res?.data?.data) {
          this.contactMessages = res.data.data;
          this.totalCount = res.data.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.showError('Failed to load contactMessages');
        this.isLoading$.next(false);
      }
    });
  }

  getUnreadCount(): void {
    const url = `${this.api.contactMessages.unreadCount}`;
    this.httpService.listGet(url, 'contactMessagesUnreadCount').subscribe({
      next: (res) => {
        if (res?.status && res?.data) {
          this.unreadCount = res.data.unread_count;
        }
      },
      error: () => {
        console.error('Failed to get unread count');
      }
    });
  }

  markAllAsRead(): void {
    const url = `${this.api.contactMessages.markAllRead}`;
    this.httpService.action(url, {}, 'markAllcontactMessagesRead').subscribe({
      next: (res: { status: any; }) => {
        if (res?.status) {
          this.toastr.showSuccess('All contactMessages marked as read');
          this.unreadCount = 0;
          // Update the local data
          this.contactMessages = this.contactMessages.map(sub => ({...sub, is_read: 1}));
        }
      },
      error: () => {
        this.toastr.showError('Failed to mark all as read');
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.list(this.page);
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'contactMessage';
    modalRef.componentInstance.message = `Do you want to delete ${item.email} ?`;
    modalRef.result.then(() => {
      this.list(1);
      this.getUnreadCount();
    });
  }

  getStatusBadge(isRead: number): string {
    return isRead ? 'bg-success' : 'bg-warning';
  }

  getStatusText(isRead: number): string {
    return isRead ? 'Read' : 'Unread';
  }
}
