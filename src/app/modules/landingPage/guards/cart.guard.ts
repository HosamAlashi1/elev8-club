import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Injectable({
  providedIn: 'root'
})
export class CartGuard implements CanActivate {
  constructor(private cartService: CartService, private router: Router) {}

  canActivate(): boolean {
    const cart = this.cartService.getCart();

    if (!cart || !cart.lines.length) {
      // 🚫 السلة فاضية → رجّع المستخدم على الشوب
      this.router.navigate(['/shop']);
      return false;
    }

    // ✅ في داتا → اسمح بالوصول
    return true;
  }
}