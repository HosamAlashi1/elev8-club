import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../../services/cart.service';
import { Order } from '../../../../services/order.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  @Input() order?: Order;
  @Input() actionLabel: string = 'Proceed to Checkout';
  @Input() actionType: 'proceed' | 'confirm' = 'proceed';
  @Input() actionHandler?: () => void;


  subtotal = 0;
  shipping = 5;
  total = 0;

  loading = false;

  private sub?: Subscription;

  constructor(private cartService: CartService) { }

  ngOnInit(): void {
    if (this.order) {
      const priced = this.cartService.priceOrder(this.order);
      this.subtotal = priced.subtotal;
      this.total = this.subtotal + this.shipping;
    } else {
      // cart mode (ديناميكي)
      this.sub = this.cartService.getCartObs().subscribe(() => {
        const priced = this.cartService.priceCart();
        this.subtotal = priced.subtotal;
        this.total = this.subtotal + this.shipping;
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async handleClick() {
    if (!this.actionHandler) return;
    this.loading = true;
    try {
      await this.actionHandler();
    } finally {
      this.loading = false;
    }
  }
}
