import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.css']
})
export class ShowComponent implements OnInit {
  @Input() id: number = 0;

  isLoading = true;
  order: any;

  constructor(
    public activeModal: NgbActiveModal,
    private httpService: HttpService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.fetchOrderDetails();
  }

  fetchOrderDetails(): void {
    this.httpService.listGet(this.api.orders.details(this.id), 'orderDetails').subscribe({
      next: (res: any) => {
        this.order = res.items
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  formatCreatedAt(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${hours}:${minutes}`;
  }
}
