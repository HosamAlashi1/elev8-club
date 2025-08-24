import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-order-demo',
  templateUrl: './order-demo.component.html',
  styleUrls: ['./order-demo.component.css']
})
export class OrderDemoComponent {
  @Input() title: string = 'Order Your Demo Package';
  @Input() description: string = 'Take the first step in early kidney disease detection from the comfort of your home.';
}
