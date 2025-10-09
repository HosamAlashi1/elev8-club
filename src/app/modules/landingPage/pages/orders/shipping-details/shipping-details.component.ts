import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CartService } from 'src/app/modules/services/cart.service';
import { OrderService, ShippingDetails } from 'src/app/modules/services/order.service';
import { CheckoutAdapter } from 'src/app/modules/services/checkout-adapter.service';

type ShipMethod = 'delivery' | 'pickup';
type ShipOption = 'standard' | 'express' | 'overnight';

const SHIPPING_RATES = {
  delivery: { standard: 5, express: 12, overnight: 25 },
  pickup: 0
};

@Component({
  selector: 'app-shipping-details',
  templateUrl: './shipping-details.component.html',
  styleUrls: ['./shipping-details.component.css'],
  animations: [
    trigger('slideAnimation', [
      state('closed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        paddingTop: '0px',
        paddingBottom: '0px'
      })),
      state('open', style({
        height: '*',
        opacity: 1,
        overflow: 'visible',
        paddingTop: '*',
        paddingBottom: '*'
      })),
      transition('closed => open', [
        animate('300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ]),
      transition('open => closed', [
        animate('250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ])
    ]),
    trigger('errorAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-5px)' }))
      ])
    ])
  ]
})
export class ShippingDetailsComponent implements OnInit {

  // فتح/إغلاق القسم
  openShipping = true;

  // Reactive Form
  form!: FormGroup;

  // إعدادات الشحن
  method: ShipMethod = 'delivery';
  option: ShipOption = 'standard';

  // الأسعار
  subtotal = 0;
  shippingFee = 5;
  total = 0;

  // قائمة الولايات / المحافظات
  states = [
    'California', 'New York', 'Texas', 'Florida',
    'Washington', 'Colorado', 'Illinois', 'Arizona'
  ];

  // قائمة الدول
  countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany',
    'France', 'Australia', 'Japan', 'South Korea',
    'Netherlands', 'Sweden', 'Norway', 'Denmark',
    'Switzerland', 'Austria', 'Belgium', 'Spain',
    'Italy', 'Portugal', 'Ireland', 'New Zealand'
  ];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private checkoutAdapter: CheckoutAdapter,
    private router: Router
  ) { }

  ngOnInit(): void {
    const priced = this.cartService.priceCart();
    if (!priced.lines.length) {
      this.router.navigate(['/cart']);
      return;
    }

    this.subtotal = priced.subtotal;
    this.recalcTotal();

    this.form = this.fb.group({
      shipping: this.fb.group({
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^[\+]?[\d\s\-\(\)]{10,}$/)]],
        address1: ['', [Validators.required]],
        address2: [''],
        city: ['', [Validators.required]],
        state: [''],
        country: ['', [Validators.required]],
        zip: ['', [Validators.required]]
      })
    });

    this.applyAddressValidators();
  }

  // تغيير طريقة الشحن
  setMethod(m: ShipMethod) {
    if (this.method === m) return;
    this.method = m;
    this.applyAddressValidators();
    this.recalcTotal();
  }

  // تغيير خيار السرعة
  setOption(o: ShipOption) {
    if (this.option === o) return;
    this.option = o;
    this.recalcTotal();
  }

  private applyAddressValidators() {
    const s = this.form.get('shipping') as FormGroup;
    const req = [Validators.required];
    const phoneReq = [Validators.required, Validators.pattern(/^[\+]?[\d\s\-\(\)]{10,}$/)];
    const fields = ['address1', 'city', 'country', 'zip'] as const;

    if (this.method === 'delivery') {
      fields.forEach(f => {
        s.get(f)?.setValidators(req);
        s.get(f)?.enable({ emitEvent: false });
        s.get(f)?.updateValueAndValidity({ emitEvent: false });
      });
      s.get('phone')?.setValidators(phoneReq);
      s.get('phone')?.enable({ emitEvent: false });
      s.get('phone')?.updateValueAndValidity({ emitEvent: false });
    } else {
      fields.forEach(f => {
        s.get(f)?.clearValidators();
        s.get(f)?.disable({ emitEvent: false });
        s.get(f)?.updateValueAndValidity({ emitEvent: false });
      });
      s.get('phone')?.clearValidators();
      s.get('phone')?.disable({ emitEvent: false });
      s.get('phone')?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private recalcTotal() {
    this.shippingFee = this.method === 'pickup'
      ? SHIPPING_RATES.pickup
      : SHIPPING_RATES.delivery[this.option];
    this.total = this.subtotal + this.shippingFee;
  }

  // متابعة الدفع
  async onProceedToPayment() {
    (this.form.get('shipping') as FormGroup).markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const order = this.orderService.getActiveDraft();
    if (!order) {
      this.router.navigate(['/cart']);
      return;
    }

    const s = (this.form.get('shipping') as FormGroup).getRawValue();
    const fullName = `${s.first_name} ${s.last_name}`.trim();

    const compact: ShippingDetails = {
      name: fullName || '',
      phone: s.phone || '',
      address: s.address1 || '',
      city: s.city || '',
      country: s.country || ''
    };

    this.orderService.updateShipping(order.id, compact);

    await this.checkoutAdapter.initiatePayment(order.id, 'mock');
    this.router.navigate(['/confirmation', order.id]);
  }

  // Getter
  get fS() {
    return (this.form.get('shipping') as FormGroup).controls;
  }
}
