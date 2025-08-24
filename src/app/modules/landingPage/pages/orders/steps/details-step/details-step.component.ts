import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';
import { OrderService } from '../../../../../services/order.service';
import { OrderData } from '../../../../../services/order.service';

@Component({
  selector: 'app-details-step',
  templateUrl: './details-step.component.html',
  styleUrls: ['./details-step.component.css'],
  animations: [
    trigger('fadeInError', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in',
          style({ opacity: 0, transform: 'translateY(-5px)' }))
      ])
    ])
  ]
})
export class DetailsStepComponent implements OnInit {
  detailsForm!: FormGroup;

  // ✅ طرق الدفع
  paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: 'assets/img/credit-card.png' },
    { id: 'paypal', label: 'PayPal', icon: 'assets/img/lock.png' },
    { id: 'cod', label: 'Cash on Delivery', icon: 'assets/img/delivery.png' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderService: OrderService // 👈 حقن الخدمة
  ) { }

  ngOnInit(): void {
    const savedData = this.orderService.getOrderData();

    // إنشاء الـ Reactive Form مع البيانات المخزنة
    this.detailsForm = this.fb.group({
      fullName: [savedData.fullName || '', Validators.required],
      email: [savedData.email || '', [Validators.required, Validators.email]],
      phone: [savedData.phone || '', Validators.required],
      country: [savedData.country || '', Validators.required],
      street: [savedData.street || '', Validators.required],
      city: [savedData.city || '', Validators.required],
      postalCode: [savedData.postalCode || '', Validators.required],
      paymentMethod: [savedData.paymentMethod || 'card', Validators.required]
    });
  }

  // ✅ السعر الكلي
  get totalPrice(): number {
    return this.orderService.getTotal();
  }

  get quantity(): number {
    return this.orderService.getOrderData().quantity;
  }

  // ✅ counter functions
  increase() {
    this.orderService.setQuantity(this.quantity + 1);
  }

  decrease() {
    if (this.quantity > 1) {
      this.orderService.setQuantity(this.quantity - 1);
    }
  }

  // ✅ عند تأكيد الطلب
  confirmOrder() {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }

    // 📝 حفظ بيانات الفورم + الكمية في الخدمة (عشان تضل محفوظة عند الرجوع)
    this.orderService.setOrderData({
      ...this.detailsForm.value,
    });

    const orderData: OrderData = this.orderService.getOrderData();

    console.log('Order confirmed ✅', orderData);

    // 🔹 Mock response مؤقت بدل الـ API الحقيقي
    const mockResponse: any = {
      orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
    };

    if (orderData.paymentMethod === 'card') {
      mockResponse.clientSecret = 'pi_mock_client_secret_123';

      /**
       * 🟣 API → Stripe Card
       * 
       * POST /api/orders/create
       * body: orderData
       * response:
       *   { orderId: string, clientSecret: string }
       * 
       * - الباك إند ينشئ PaymentIntent من Stripe
       * - يرجع clientSecret
       * - بعدين بتستخدمه في صفحة الدفع مع Stripe Elements
       */
      this.router.navigate(['/orders/payment'], {
        queryParams: {
          clientSecret: mockResponse.clientSecret,
          orderId: mockResponse.orderId
        }
      });

    } else if (orderData.paymentMethod === 'paypal') {
      mockResponse.paypalUrl = 'https://www.sandbox.paypal.com/checkoutnow?token=MOCK123';

      /**
       * 🟣 API → PayPal
       * 
       * POST /api/orders/create
       * body: orderData
       * response:
       *   { orderId: string, paypalUrl: string }
       * 
       * - الباك إند بيرجع رابط PayPal Checkout
       * - تعمل redirect مباشرة على الرابط
       */
      window.location.href = mockResponse.paypalUrl;

    } else {
      /**
       * 🟣 API → Cash on Delivery (COD)
       * 
       * POST /api/orders/create
       * body: orderData
       * response:
       *   { orderId: string }
       * 
       * - الطلب بيتخزن في DB بحالة Pending
       * - المستخدم يروح مباشرة لصفحة التأكيد
       */
      this.router.navigate(['/orders/confirmation', mockResponse.orderId], {
        queryParams: {
          total: orderData.total,
          status: 'success'
        }
      });
    }
  }

  // ✅ اختيار وسيلة الدفع
  selectPayment(methodId: string) {
    this.detailsForm.get('paymentMethod')?.setValue(methodId);
  }
}
