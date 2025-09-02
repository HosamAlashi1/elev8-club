import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../services/api.service';
import { HttpService } from '../../../../services/http.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.css']
})
export class OrderDetailsComponent implements OnInit {

  public orderId: number;
  public order: any = null;
  public isLoading = true;

  constructor(
    public activeModal: NgbActiveModal,
    private api: ApiService,
    public httpService: HttpService,
    private toastr: ToastrsService
  ) { }

  ngOnInit(): void {
    if (this.orderId) {
      this.loadOrderDetails();
    }
  }

  loadOrderDetails(): void {
    this.isLoading = true;
    const url = this.api.orders.details(this.orderId);
    
    this.httpService.listGet(url).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          this.order = res.data;
        } else {
          this.toastr.showError('Failed to load order details');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading order:', error);
        this.toastr.showError('Failed to load order details');
        this.isLoading = false;
      }
    });
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

}
