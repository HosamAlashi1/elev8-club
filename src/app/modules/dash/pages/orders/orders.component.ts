import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  orders: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  statusFilter = '';
  paymentStatusFilter = '';
  searchChanged: Subject<string> = new Subject<string>();

  // Filter options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' }
  ];

  constructor(
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal,
    private api: ApiService,
    public httpService: HttpService
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
  }

  ngOnInit(): void {
    this.loadData();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
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
      search: this.searchText.trim(),
      status: this.statusFilter || undefined,
      payment_status: this.paymentStatusFilter || undefined
    };

    const url = `${this.api.orders.list}`;
    this.httpService.list(url, payload, 'ordersList').subscribe({
      next: (res) => {
        if (res?.status && res?.data?.data) {
          this.orders = res.data.data;
          this.totalCount = res.data.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.showError('Failed to load orders');
        this.isLoading$.next(false);
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  onPaymentStatusFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  reset(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.paymentStatusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  viewDetails(order: any): void {
    const modalRef = this.modalService.open(OrderDetailsComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.orderId = order.id;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getPaymentStatusBadgeClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  markAllAsRead(): void {
    const url = `${this.api.orders.markAllRead}`;
    this.httpService.action(url, {}, 'markAllOrdersRead').subscribe({
      next: (res: any) => {
        if (res.status) {
          this.toastr.showSuccess('All orders marked as read');
          this.list(this.page); // Refresh list
        }
      },
      error: () => {
        this.toastr.showError('Failed to mark orders as read');
      }
    });
  }
}
