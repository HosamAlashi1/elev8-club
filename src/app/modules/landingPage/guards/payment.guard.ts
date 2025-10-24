import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OrderService, ShippingDetails } from '../../services/order.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentGuard implements CanActivate {
  constructor(private orderService: OrderService, private router: Router) {}

  canActivate(): boolean {
    const lastOrder = this.orderService.getLastDraftOrder();

    if (!lastOrder || lastOrder.status !== 'awaiting_payment') {
      // 🚫 لو مافي Order أو تفاصيل الشحن لسا مش كاملة
      this.router.navigate(['/orders/details']);
      return false;
    }

    const shipping = lastOrder.shipping as ShippingDetails;
    const valid = !!(shipping?.name && shipping?.phone && shipping?.address && shipping?.city && shipping?.country);

    if (!valid) {
      // 🚫 بيانات الشحن ناقصة → رجّع المستخدم على التفاصيل
      this.router.navigate(['/orders/details']);
      return false;
    }

    //  بيانات الشحن كاملة → اسمح بالدخول
    return true;
  }
}
