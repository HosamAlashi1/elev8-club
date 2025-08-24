import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../../../services/order.service';

@Component({
  selector: 'app-cart-step',
  templateUrl: './cart-step.component.html',
  styleUrls: ['./cart-step.component.css']
})
export class CartStepComponent {
  quantity: number;
  pricePerUnit: number;

  features = [
    { image: 'assets/img/home.png', title: 'Easy at-home testing', description: 'Convenient testing from your home' },
    { image: 'assets/img/ai.png', title: 'AI analysis', description: 'Reliable results with AI technology' },
    { image: 'assets/img/secure.png', title: 'Secure connection', description: 'Connected with medical centers' }
  ];

  constructor(private router: Router, private orderService: OrderService) {
    this.quantity = this.orderService.getQuantity();
    this.pricePerUnit = this.orderService.getPricePerUnit();
  }

  get totalPrice(): number {
    return this.orderService.getTotal();
  }

  increase() {
    this.quantity++;
    this.orderService.setQuantity(this.quantity);
  }

  decrease() {
    if (this.quantity > 1) {
      this.quantity--;
      this.orderService.setQuantity(this.quantity);
    }
  }

  goToDetails() {
    this.router.navigate(['/orders/details']);
  }
}
