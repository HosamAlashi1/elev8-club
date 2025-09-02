import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Injectable({
    providedIn: 'root'
})
export class DetailsGuard implements CanActivate {
    constructor(private orderService: OrderService, private router: Router) { }

    canActivate(): boolean {
        const draft = this.orderService.getActiveDraft() ?? this.orderService.getLastDraftOrder();
        if (!draft) {
            this.router.navigate(['/orders/cart']);
            return false;
        }
        return true;
    }
}
