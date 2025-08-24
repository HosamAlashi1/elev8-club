import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface OrderData {
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  paymentMethod?: string;

  // ✅ بيانات الدفع
  cardNumber?: string;
  cardholder?: string;
  expiry?: string;
  cvv?: string;

  quantity: number;
  pricePerUnit: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private defaultData: OrderData = {
    fullName: '',
    email: '',
    phone: '',
    country: '',
    street: '',
    city: '',
    postalCode: '',
    paymentMethod: 'card',

    // بيانات الدفع افتراضية
    cardNumber: '',
    cardholder: '',
    expiry: '',
    cvv: '',

    quantity: 1,
    pricePerUnit: 12,
    total: 1 * 12
  };

  private orderDataSubject = new BehaviorSubject<OrderData>(this.defaultData);
  orderData$ = this.orderDataSubject.asObservable();

  // ✅ جلب نسخة من البيانات الحالية
  getOrderData(): OrderData {
    return this.orderDataSubject.value;
  }

  // ✅ تحديث أي جزء من البيانات (Details + Payment)
  setOrderData(data: Partial<OrderData>) {
    const updated = {
      ...this.orderDataSubject.value,
      ...data,
    };

    // إعادة حساب total لو تغيّرت الكمية أو السعر
    updated.total = updated.quantity * updated.pricePerUnit;

    this.orderDataSubject.next(updated);
  }

  // ✅ تحديث الكمية
  setQuantity(quantity: number) {
    this.setOrderData({ quantity });
  }

  getQuantity(): number {
    return this.orderDataSubject.value.quantity;
  }

  // ✅ إرجاع السعر الكلي
  getTotal(): number {
    return this.getOrderData().total;
  }

  // ✅ إرجاع السعر للوحدة
  getPricePerUnit(): number {
    return this.getOrderData().pricePerUnit;
  }

  // ✅ إعادة ضبط الطلب (تمسح كلشي بعد نجاح العملية)
  clearOrderData() {
    this.orderDataSubject.next(this.defaultData);
  }
}
