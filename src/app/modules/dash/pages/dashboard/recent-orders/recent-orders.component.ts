import { Component, Input, OnInit } from '@angular/core';
import { PublicService } from 'src/app/modules/services/public.service';

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.css']
})
export class RecentOrdersComponent implements OnInit {
  @Input() orders: any[] = [];
  isLoading = true;

  constructor(private publicService: PublicService) {}

  ngOnInit(): void {
    // محاكاة API call - تأخير قصير
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-completed';
      case 'processing': return 'badge-processing';
      case 'pending': return 'badge-pending';
      default: return '';
    }
  }

    openImageModal(image: string) {
    this.publicService.openImage('Book Image', image);
  }
}
