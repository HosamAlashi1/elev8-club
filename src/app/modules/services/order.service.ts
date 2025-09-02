import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface OrderItem {
  bookId: string;
  qty: number;
}

export interface ShippingDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  shipping?: ShippingDetails;
  status: 'draft' | 'awaiting_payment' | 'confirmed';
  total: number;
  currency: string;
}

const STORAGE_KEY = 'lh:orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private orders: Order[] = [];
  // داخل OrderService
  private ACTIVE_KEY = 'lh:activeOrderId';
  private activeOrderId?: string;

  constructor() {
    this.loadFromStorage();
    this.activeOrderId = sessionStorage.getItem(this.ACTIVE_KEY) || undefined;
  }

  /**
   * 🟢 إنشاء طلبية جديدة من السلة
   * Mock: بياخد items ويخزن order بـ localStorage
   *
   * 🔹 API الحقيقي (Backend):
   * POST /orders
   * Body: { items: [{ bookId, qty }] }
   * Response: { orderId, status: "draft", total, currency }
   */
  createOrderFromCart(items: OrderItem[]): Order {
    const order: Order = {
      id: uuidv4(),
      items: JSON.parse(JSON.stringify(items)), // snapshot
      status: 'draft',
      total: 0,
      currency: 'USD'
    };
    this.orders.push(order);
    this.setActiveDraft(order.id);
    this.commit();
    return order;
  }


  setActiveDraft(id: string) {
    this.activeOrderId = id;
    sessionStorage.setItem(this.ACTIVE_KEY, id);
  }

  getActiveDraft(): Order | undefined {
    const id = this.activeOrderId || sessionStorage.getItem(this.ACTIVE_KEY) || undefined;
    return id ? this.orders.find(o => o.id === id && o.status !== 'confirmed') : undefined;
  }



  /**
   * ✏️ تحديث بيانات الشحن
   *
   * 🔹 API الحقيقي:
   * PATCH /orders/{orderId}/shipping
   * Body: { name, phone, address, city, country }
   * Response: { orderId, status: "awaiting_payment", shipping: {...} }
   */
  updateShipping(orderId: string, details: ShippingDetails): Order | null {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;
    order.shipping = details;
    order.status = 'awaiting_payment';
    this.commit();
    return order;
  }

  /**
   * 💳 بدء عملية الدفع
   * Mock: نغيّر status ونرجع رابط وهمي
   *
   * 🔹 API الحقيقي:
   * POST /orders/{orderId}/payment
   * Body: { method: "stripe" | "paypal" | ... }
   * Response: { paymentUrl: "https://gateway.com/session" }
   */
  initiatePayment(orderId: string, method: string = 'mock'): string | null {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    // Mock → رابط وهمي
    return `https://payment-gateway-mock.com/pay/${order.id}`;
  }

  /**
   * ✅ تأكيد الطلب بعد الدفع
   *
   * 🔹 API الحقيقي:
   * GET /orders/{orderId}/confirmation
   * Response: {
   *   orderId, status: "confirmed", total, currency, items, shipping, createdAt
   * }
   */
  confirmOrder(orderId: string): Order | null {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;
    order.status = 'confirmed';
    this.commit();
    // نظّف الـ active لو هو نفسه
    if (this.activeOrderId === orderId) {
      this.activeOrderId = undefined;
      sessionStorage.removeItem(this.ACTIVE_KEY);
    }
    return order;
  }

  /** 🧾 جلب طلبية */
  getOrderById(orderId: string): Order | undefined {
    return this.orders.find(o => o.id === orderId);
  }

  /** 💾 حفظ */
  private commit() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
  }

  /** 📂 تحميل */
  private loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.orders = JSON.parse(raw);
      } catch {
        this.orders = [];
      }
    }
  }

  getLastDraftOrder() {
    return this.orders.find(o => o.status === 'draft');
  }

  getLastOrderAwaitingPayment() {
    return this.orders.find(o => o.status === 'awaiting_payment');
  }
}
