import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CatalogService } from './catalog.service';

/**
 * سطر واحد في السلة (bookId + qty)
 */
export interface CartLine {
  bookId: string;   // معرّف الكتاب
  qty: number;      // الكمية المطلوبة
}

/**
 * الحالة الخام للسلة (المخزنة فقط)
 */
export interface CartState {
  lines: CartLine[];
  currency: string; 
  schemaVersion: number;
}

/**
 * نسخة مسعّرة للاستخدام في الـ UI
 */
export interface PricedLine {
  bookId: string;
  title?: string;
  unitPrice: number;
  qty: number;
  subtotal: number;
}

export interface PricedSummary {
  lines: PricedLine[];
  subtotal: number;
  currency: string;
}

const STORAGE_KEY = 'lh:cart:v1';
const SCHEMA_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartState: CartState = { lines: [], currency: 'USD', schemaVersion: SCHEMA_VERSION };
  private cart$ = new BehaviorSubject<CartState>(this.cartState);

  constructor(private catalog: CatalogService) {
    this.loadFromStorage();

    // 🌀 Sync بين التبويبات (localStorage event)
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY && e.newValue) {
        this.cartState = JSON.parse(e.newValue);
        this.cart$.next(this.cartState);
      }
    });
  }

  /** 🟢 Observable للاستخدام بالكومبوننت */
  getCartObs() {
    return this.cart$.asObservable();
  }

  /** 🔵 snapshot */
  getCart() {
    return this.cartState;
  }

  /**
   * ➕ إضافة كتاب للسلة
   *
   *  API المقابل (Backend):
   * POST /cart/add
   * Body: { bookId: string, qty: number }
   * Response: { success: boolean, cart: {...} }
   */
  add(bookId: string, qty: number = 1) {
    const existing = this.cartState.lines.find(l => l.bookId === bookId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cartState.lines.push({ bookId, qty });
    }
    this.commit();
  }

  /**
   * ✏️ تحديث الكمية
   *
   *  API المقابل:
   * PATCH /cart/{bookId}
   * Body: { qty: number }
   * Response: { success: boolean, cart: {...} }
   */
  updateQty(bookId: string, qty: number) {
    const line = this.cartState.lines.find(l => l.bookId === bookId);
    if (line) {
      line.qty = qty;
      if (line.qty <= 0) {
        this.remove(bookId);
      } else {
        this.commit();
      }
    }
  }

  /**
   * 🗑️ حذف كتاب من السلة
   *
   *  API المقابل:
   * DELETE /cart/{bookId}
   * Response: { success: boolean, cart: {...} }
   */
  remove(bookId: string) {
    this.cartState.lines = this.cartState.lines.filter(l => l.bookId !== bookId);
    this.commit();
  }

  /**
   * 🧹 تفريغ السلة بالكامل
   *
   *  API المقابل:
   * DELETE /cart
   * Response: { success: boolean, cart: { items: [], total: 0 } }
   */
  clear() {
    this.cartState.lines = [];
    this.commit();
  }

  /** 💾 حفظ في localStorage */
  private commit() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cartState));
    this.cart$.next({ ...this.cartState });
  }

  /**
   * 📂 تحميل من localStorage
   *
   *  API المقابل:
   * GET /cart
   * Response: {
   *   items: [
   *     { bookId: '123', title: 'Book Title', price: 25.99, qty: 2, subtotal: 51.98 }
   *   ],
   *   total: 51.98,
   *   currency: 'USD'
   * }
   */
  private loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.cartState = JSON.parse(raw);
      } catch {
        this.cartState = { lines: [], currency: 'USD', schemaVersion: SCHEMA_VERSION };
      }
    }
    this.cart$.next(this.cartState);
  }

  /**
   * 🧾 تسعير السلة الحالية
   * - دايمًا يعتمد على الأسعار من الكاتالوج (مش من التخزين)
   */
  priceCart(): PricedSummary {
    const catalog = this.catalog.getAllBooks();
    const lines = this.cartState.lines.map(line => {
      const book = catalog.find(b => b.id === line.bookId);
      const unit = book ? book.price : 0;
      return {
        bookId: line.bookId,
        title: book?.title,
        unitPrice: unit,
        qty: line.qty,
        subtotal: +(unit * line.qty).toFixed(2)
      };
    });
    const subtotal = +lines.reduce((s, l) => s + l.subtotal, 0).toFixed(2);
    return { lines, subtotal, currency: this.cartState.currency };
  }

  /**
   * 🧾 تسعير Order معيّن (من OrderService)
   */
  priceOrder(order: import('./order.service').Order): PricedSummary {
    const catalog = this.catalog.getAllBooks();
    const lines = order.items.map(item => {
      const book = catalog.find(b => b.id === item.bookId);
      const unit = book ? book.price : 0;
      return {
        bookId: item.bookId,
        title: book?.title,
        unitPrice: unit,
        qty: item.qty,
        subtotal: +(unit * item.qty).toFixed(2)
      };
    });
    const subtotal = +lines.reduce((s, l) => s + l.subtotal, 0).toFixed(2);
    return { lines, subtotal, currency: order.currency };
  }
}
