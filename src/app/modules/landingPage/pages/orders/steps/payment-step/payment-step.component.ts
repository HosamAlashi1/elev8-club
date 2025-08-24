import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { OrderService, OrderData } from '../../../../../services/order.service';

@Component({
  selector: 'app-payment-step',
  templateUrl: './payment-step.component.html',
  styleUrls: ['./payment-step.component.css'],
  animations: [
    trigger('fadeInError', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class PaymentStepComponent implements OnInit {
  paymentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // ✅ جلب البيانات المحفوظة من OrderService
    const orderData: OrderData = this.orderService.getOrderData();

    // ✅ بناء الفورم مع فاليديشن
    this.paymentForm = this.fb.group({
      cardNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{16}$/)] // 16 رقم بالضبط
      ],
      cardholder: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)] // اسم فقط
      ],
      expiry: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/),
          this.expiryDateValidator
        ]
      ],
      cvv: [
        '',
        [Validators.required, Validators.pattern(/^\d{3,4}$/)] // 3 أو 4 أرقام
      ]
    });

    // ✅ إعادة تعبئة البيانات لو موجودة
    this.paymentForm.patchValue({
      cardNumber: orderData.cardNumber || '',
      cardholder: orderData.cardholder || '',
      expiry: orderData.expiry || '',
      cvv: orderData.cvv || ''
    });

    // 🟣 Debug - استقبال clientSecret أو orderId من الستيب السابقة
    this.route.queryParams.subscribe(params => {
      console.log('🔑 Payment Params:', params);
    });
  }

  // ✅ تحقق أن تاريخ الانتهاء صالح
  expiryDateValidator(control: AbstractControl) {
    if (!control.value) return null;

    const [month, year] = control.value.split('/');
    if (!month || !year) return { invalidDate: true };

    const expMonth = parseInt(month, 10);
    const expYear = 2000 + parseInt(year, 10);

    const today = new Date();
    const expiryDate = new Date(expYear, expMonth - 1, 1);

    return expiryDate < today ? { expired: true } : null;
  }

  // ✅ السعر الكلي (من الخدمة)
  get totalPrice(): number {
    return this.orderService.getTotal();
  }

  get quantity(): number {
    return this.orderService.getQuantity();
  }

  // ✅ لما يضغط Checkout
  processPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    // 🟣 حفظ بيانات الدفع في OrderService
    this.orderService.setOrderData({
      ...this.paymentForm.value
    });

    const paymentData: OrderData = this.orderService.getOrderData();
    console.log('💳 Processing Payment...', paymentData);

    /**
     * 🟣 API المتوقع:
     * POST /api/payments/confirm
     * body: { ...paymentData, clientSecret }
     * response: { status: "success" | "error", orderId: string }
     * 
     * إذا success → Confirmation Success (clear data)
     * إذا error → Confirmation Error (keep data)
     */
    const isSuccess = true || false;

    if (isSuccess) {
      this.router.navigate(['/orders/confirmation', 'ORD-12345'], {
        queryParams: { total: paymentData.total, status: 'success' }
      });

      // ✅ مسح البيانات بعد نجاح العملية
      this.orderService.clearOrderData();
    } else {
      this.router.navigate(['/orders/confirmation', 'ORD-12345'], {
        queryParams: { total: paymentData.total, status: 'error' }
      });

      // ❌ في حالة الخطأ → البيانات تظل محفوظة
    }
  }
}
