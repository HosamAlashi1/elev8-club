import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../../../services/order.service'; // 👈 استدعاء الخدمة

@Component({
  selector: 'app-confirmation-step',
  templateUrl: './confirmation-step.component.html',
  styleUrls: ['./confirmation-step.component.css']
})
export class ConfirmationStepComponent implements OnInit, OnDestroy {
  orderId: string | null = null;
  total: number | null = null;
  status: 'success' | 'error' = 'success';
  countdown: number = 10;

  private interval!: ReturnType<typeof setInterval>;
  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService // 👈 inject service
  ) {}

  ngOnInit(): void {
  // 📦 جلب orderId من الباث
  this.subs.push(
    this.route.params.subscribe(params => {
      this.orderId = params['orderId'] || 'ORD-UNKNOWN';
    })
  );

  // 📦 جلب total + status من queryParams
  this.subs.push(
    this.route.queryParams.subscribe(params => {
      this.total = params['total'] ? +params['total'] : null;
      this.status = params['status'] === 'error' ? 'error' : 'success';
    })
  );

  if (this.status === 'success') {
    // 🎉 نجاح → كونفيتي + تفريغ البيانات
    this.launchConfetti();
    this.orderService.clearOrderData(); 
  } else {
    // ❌ فشل → خليه يحتفظ بالبيانات (ما منمسح اشي)
    console.warn('❌ Payment failed. Keeping order data so user can retry.');
  }

  // ⏳ عداد رجوع تلقائي
  this.interval = setInterval(() => {
    if (this.countdown > 1) {
      this.countdown--;
    } else {
      this.back();
    }
  }, 1000);
}

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
    this.subs.forEach(s => s.unsubscribe());
  }

  /**
   * 👈 لو نجاح → رجوع للهوم
   * 👈 لو خطأ → رجوع على الكارت
   */
  back() {
    if (this.status === 'success') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/orders/cart']);
    }
  }

  // 🎉 كونفيتي بسيط (canvas-confetti)
  private launchConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      const confetti = (window as any).confetti;
      if (confetti) {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }
}
