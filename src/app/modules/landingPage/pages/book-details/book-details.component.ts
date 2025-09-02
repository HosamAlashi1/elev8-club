import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService, Book } from '../../../services/catalog.service'; // عدّل المسار حسب مشروعك
import { CartService } from '../../../services/cart.service'; // عدّل المسار حسب مشروعك
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css']
})
export class BookDetailsComponent implements OnInit, OnDestroy {
  book?: Book;
  qty = 1;
  format: 'ebook' | 'audiobook' | 'both' = 'ebook';

  selectedImg = '';
  imgLoaded = false;
  lastIndex = 0;

  // للأنيميشن الجديد
  oldImg = '';
  newImg = '';
  isTransitioning = false;
  slideDirection: 'left' | 'right' = 'left';

  // للسلة والتوست
  isAddingToCart = false;
  showSuccess = false;
  showToast = false;
  toastMessage = '';

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private catalog: CatalogService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(p => {
      const id = p.get('id') || '';
      const b = this.catalog.getBookById(id);
      if (!b) return;

      this.book = b;
      this.selectedImg = b.images?.[0] || 'assets/img/blank.png';
      this.lastIndex = 0;

      // ⬅️ هنا التعديل
      const cart = this.cart.getCart();
      const existingLine = cart.lines.find(l => l.bookId === b.id);
      this.qty = existingLine ? existingLine.qty : 1;

      this.imgLoaded = false;
      setTimeout(() => (this.imgLoaded = true), 0);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // نجوم التقييم
  stars() { return [1, 2, 3, 4, 5]; }
  isFill(val: number, i: number) { return i <= Math.floor(val); }
  isHalf(val: number, i: number) { return i === Math.ceil(val) && val % 1 >= 0.5 && !this.isFill(val, i); }

  // صور المعرض مع أنيميشن Swiper-style
  selectImage(img: string) {
    if (!this.book || img === this.selectedImg || this.isTransitioning) return;

    const newIndex = this.book.images.indexOf(img);
    this.slideDirection = newIndex > this.lastIndex ? 'left' : 'right';

    // بدء الانتقال
    this.isTransitioning = true;
    this.oldImg = this.selectedImg;
    this.newImg = img;

    console.log(`🎬 Starting transition: ${this.slideDirection}, from ${this.lastIndex} to ${newIndex}`);

    // انتظار انتهاء الانيميشن (0.5s)
    setTimeout(() => {
      this.selectedImg = img;
      this.lastIndex = newIndex;
      this.finishTransition();
    }, 400);
  }

  private finishTransition() {
    this.isTransitioning = false;
    this.oldImg = '';
    this.newImg = '';
    this.imgLoaded = true;
    console.log('✅ Transition completed');
  }

  onMainImgLoad() {
    if (!this.isTransitioning) {
      this.imgLoaded = true;
    }
  }

  onNewImgLoad() {
    console.log('🖼️ New image loaded during transition');
  }

  // الكمية
  dec() { if (this.qty > 1) this.qty--; }
  inc() { if (this.qty < 99) this.qty++; }

  // إضافة للسلة مع أنيميشن جميل
  async addToCart() {
    if (!this.book || this.isAddingToCart) return;

    this.isAddingToCart = true;

    // أنيميشن ripple للكتاب
    this.addRippleEffect();

    try {
      // محاكاة تأخير API (للواقعية)
      await new Promise(resolve => setTimeout(resolve, 400));

      // تحقق من وجود الكتاب في السلة
      const cart = this.cart.getCart();
      const exists = cart.lines.some(l => l.bookId === this.book!.id);

      if (exists) {
        // لو موجود → حدّث الكمية
        this.cart.updateQty(this.book.id, this.qty);
        this.toastMessage = `Updated "${this.book.title}" quantity to ${this.qty}`;
      } else {
        // لو مش موجود → أضفه
        this.cart.add(this.book.id, this.qty);
        this.toastMessage = `"${this.book.title}" (${this.qty}x) added to your cart`;
      }

      // إظهار حالة النجاح
      this.isAddingToCart = false;
      this.showSuccess = true;

      // إظهار التوست
      this.showToast = true;

      // إخفاء حالة النجاح بعد ثانيتين
      setTimeout(() => {
        this.showSuccess = false;
      }, 2000);

      // إخفاء التوست تلقائياً بعد 4 ثوان
      setTimeout(() => {
        this.hideToast();
      }, 4000);

      console.log(`✅ Added to cart: ${this.book.title} x${this.qty}`);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      this.isAddingToCart = false;
      // يمكن إضافة error toast هنا
    }
  }

  // إضافة تأثير ripple للكتاب
  private addRippleEffect() {
    const bookElement = document.querySelector('.gallery-main');
    if (bookElement) {
      bookElement.classList.add('book-ripple');
      setTimeout(() => {
        bookElement.classList.remove('book-ripple');
      }, 600);
    }
  }

  // إخفاء التوست
  hideToast() {
    this.showToast = false;
  }


}
