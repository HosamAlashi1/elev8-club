import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from '../../services/http.service';
import { ApiService } from '../../services/api.service';
import { PublicService } from '../../services/public.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ShowComponent } from './show/show.component';
import { ToastrsService } from '../../services/toater.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(false);
  orders: any[] = [];

  columns = [
    { label: 'Order ID', key: 'id', width: 'w-5' },
    { label: 'Restaurant', key: 'restaurant_name', width: 'w-20' },
    { label: 'User', key: 'user_name', width: 'w-25' },
    { label: 'Total', key: 'total_cost', width: 'w-15' },
    { label: 'Time', key: 'created_at', width: 'w-10' },
    { label: 'Status', key: 'status_title', width: 'w-10' },
  ];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  statusFilter: string = '';

  // Options for status filter
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'initial', label: 'Initial' },
    { value: 'pending', label: 'Pending' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'on_way', label: 'On Way' }
  ];

  constructor(
    private http: HttpService,
    private api: ApiService,
    private publicService: PublicService,
    private modalService: NgbModal,
    private toastr: ToastrsService
  ) {
    this.size = this.publicService.getNumOfRows(315, 64);
  }

  ngOnInit(): void {
    this.loadOrders();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.isLoading$.next(true);
    const payload = {
      perPage: this.size,
      page: this.page,
      search: this.searchText.trim(),
      status: this.statusFilter || undefined
    };

    this.http.list(this.api.orders.list, payload, 'orders').subscribe({
      next: (res) => {
        this.orders = (res?.items?.data || []).map((order: any) => ({
          id: order.id,
          restaurant_name: order.restaurant?.name || '-',
          user_name: order.user?.name || '-',
          total_cost: order.total_cost,
          delivery_fee: order.delivery_fee,
          created_at: this.formatCreatedAt(order.created_at),
          status_title: order.status_title || '-',
          status_value: order.status || 'initial'
        }));
        this.totalCount = res?.items?.total_records || 0;
      },
      error: () => {
        this.orders = [];
        this.totalCount = 0;
      },
      complete: () => {
        this.isLoading$.next(false);
      }
    });
  }

  list(page: number): void {
    this.page = page;
    this.loadOrders();
  }

  formatCreatedAt(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${hours}:${minutes}`;
  }

  show(order: any) {
    const modalRef = this.modalService.open(ShowComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.id = order.id;
  }

  reset(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  onFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  onStatusChange(order: any, newStatus: string): void {
    const payload = { status: newStatus };
    const url = this.api.orders.updateStatus(order.id);
    this.http.action(url, payload, 'orderStatus').subscribe({
      next: (res : any) => {
        if (res?.status) {
          this.toastr.Showsuccess('Status updated successfully');
          order.status_value = newStatus;
          const selectedOption = this.statusOptions.find(opt => opt.value === newStatus);
          order.status_title = selectedOption?.label || newStatus;
        }
      },
      error: () => {
        this.toastr.Showerror('Failed to update status');
      }
    });
  }

}
