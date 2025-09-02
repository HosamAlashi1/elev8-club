import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from 'src/app/modules/services/cart.service';
import { OrderService } from 'src/app/modules/services/order.service';
import { CatalogService } from 'src/app/modules/services/catalog.service';
import { ToastrsService } from 'src/app/modules/services/toater.service';

interface CartVM {
  bookId: string;
  title: string;
  author: string;
  thumb: string;
  unitPrice: number;
  qty: number;
  subtotal: number;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  items: CartVM[] = [];
  private sub?: Subscription;
  qty: number = 1;

  constructor(
    private cartService: CartService,
    private catalog: CatalogService,
    private orderService: OrderService,
    private router: Router,
    private toasterService: ToastrsService
  ) { }

  ngOnInit(): void {
    // أول تحميل
    this.rebuildVM();
    // متابعة أي تغيير بالسلة
    this.sub = this.cartService.getCartObs().subscribe(() => this.rebuildVM());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private rebuildVM() {
    const priced = this.cartService.priceCart();
    this.items = priced.lines.map(l => {
      const b = this.catalog.getBookById(l.bookId);
      return {
        bookId: l.bookId,
        title: b?.title ?? l.bookId,
        author: b?.author ?? '',
        thumb: b?.images?.[0] || 'assets/img/blank.png',
        unitPrice: l.unitPrice,
        qty: l.qty,
        subtotal: l.subtotal
      };
    });
  }

  // تحكّم بالكمية
  dec(item: CartVM, el?: HTMLElement) {
    if (item.qty <= 1) return;
    this.cartService.updateQty(item.bookId, item.qty - 1);
    if (el) this.triggerAnim(el, 'animate-down');
  }

  inc(item: CartVM, el?: HTMLElement) {
    if (item.qty >= 99) return;
    this.cartService.updateQty(item.bookId, item.qty + 1);
    if (el) this.triggerAnim(el, 'animate-up');
  }

  remove(bookId: string) {
    const element = document.querySelector(`[data-product-id="${bookId}"]`);
    if (element) {
      // إضافة كلاس الحذف مع الأنيميشن
      element.classList.add('removing');
      
      // انتظار انتهاء الأنيميشن ثم الحذف من الكارت
      setTimeout(() => {
        this.cartService.remove(bookId);
        // this.toasterService.showSuccess('تم حذف المنتج من السلة');
      }, 600); // مدة الأنيميشن الجديدة
    } else {
      // إذا لم نجد العنصر، احذف مباشرة
      this.cartService.remove(bookId);
      // this.toasterService.showSuccess('تم حذف المنتج من السلة');
    }
  }

  trackById = (_: number, it: CartVM) => it.bookId;

  // زر الملخّص → ينشئ أوردر درافت وينتقل لصفحة الشحن
  proceedToShipping = async () => {
    const priced = this.cartService.priceCart();
    if (!priced.lines.length) return;

    // snapshot للآيتمز
    const items = priced.lines.map(l => ({ bookId: l.bookId, qty: l.qty }));

    // محاكاة API صغيرة
    await new Promise(res => setTimeout(res, 700));

    this.orderService.createOrderFromCart(items);
    // تنقّل لصفحة الشحن
    this.router.navigate(['/shipping-details']);
  };


  triggerAnim(el: HTMLElement, className: string) {
    el.classList.remove('animate-up', 'animate-down');
    void el.offsetWidth; // لإعادة تشغيل الأنيميشين
    el.classList.add(className);
  }


}


