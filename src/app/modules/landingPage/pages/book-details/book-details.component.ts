import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiLandingService } from '../../../services/api.landing.service';
import { CartService } from '../../../services/cart.service';
import { HttpService } from 'src/app/modules/services/http.service';
import { LandingAuthSessionService } from '../../../services/auth-session.service';
import { LandingAccountModalComponent } from '../../shared/account/landing-account-modal/landing-account-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css']
})
export class BookDetailsComponent implements OnInit, OnDestroy {
  book: any;
  qty = 1;
  format: 'ebook' | 'audiobook' | 'both' = 'ebook';

  selectedImg = '';
  imgLoaded = false;
  lastIndex = 0;

  // للأنيميشن
  oldImg = '';
  newImg = '';
  isTransitioning = false;
  slideDirection: 'left' | 'right' = 'left';

  // للسلة والتوست
  isAddingToCart = false;
  showSuccess = false;
  showToast = false;
  toastMessage = '';

  isLoading = true;
  hasError = false;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiLandingService,
    private http: HttpService,
    private cart: CartService,
    public authSession: LandingAuthSessionService,  // public for template access
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.loadBookDetails(+id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadBookDetails(id: number): void {
    this.isLoading = true;
    this.hasError = false;

    const url = this.api.books.details(id);
    this.http.listGet(url, 'book_details').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          const b = res.data;

          // تطبيع الرد إلى ViewModel متوافق مع الـ template
          const vm = {
            id: b.id,
            title: b.title,
            description: b.description,
            isbn: b.isbn,
            price: b.price,
            stock: b.stock,
            orders_count: b.orders_count,
            category: b.category,
            images: Array.isArray(b.images) ? b.images : [],
            published: b.published,
            author: b.author,
            pages: b.page_count,          // <-- للـ template
            rating: b.rating_avg,         // <-- للـ template
            reviewsCount: b.reviews_count, // <-- للـ template
            reviews: (b.reviews || []).map((r: any) => ({
              id: r.id,
              text: r.comment || '',                           // <-- r.text في الـ template
              rating: r.rating,
              reviewer: r?.customer?.full_name || 'Anonymous', // <-- r.reviewer في الـ template
              avatar: r?.customer?.image || 'assets/img/blank.png'
            })),
            // احتفظ بالأصلي لو حبيّت تستخدمه لاحقًا
            _raw: b
          };

          this.book = vm;
          this.selectedImg = vm.images?.[0] || 'assets/img/blank.png';
          this.lastIndex = 0;

          // كمية موجودة في السلة؟
          const cart = this.cart.getCart();
          const existingLine = cart.lines.find((l: any) => l.bookId === vm.id);
          this.qty = existingLine ? existingLine.qty : 1;

          this.imgLoaded = false;
          setTimeout(() => (this.imgLoaded = true), 0);
          this.isLoading = false;
        } else {
          this.hasError = true;
          this.isLoading = false;
          console.error('❌ Invalid response for book details:', res);
        }
      },
      error: err => {
        this.hasError = true;
        this.isLoading = false;
        console.error('❌ API Error loading book details:', err);
      }
    });
  }


  // نجوم التقييم
  stars() { return [1, 2, 3, 4, 5]; }
  isFill(val: number, i: number) { return i <= Math.floor(val); }
  isHalf(val: number, i: number) { return i === Math.ceil(val) && val % 1 >= 0.5 && !this.isFill(val, i); }

  // 🔸 Swiper-style transition
  selectImage(img: string) {
    if (!this.book || img === this.selectedImg || this.isTransitioning) return;

    const newIndex = this.book.images.indexOf(img);
    this.slideDirection = newIndex > this.lastIndex ? 'left' : 'right';

    this.isTransitioning = true;
    this.oldImg = this.selectedImg;
    this.newImg = img;

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
  }

  onMainImgLoad() {
    if (!this.isTransitioning) this.imgLoaded = true;
  }

  onNewImgLoad() {
    console.log('🖼️ New image loaded during transition');
  }

  // الكمية
  dec() { if (this.qty > 1) this.qty--; }
  inc() { if (this.qty < 99) this.qty++; }

  // 🔹 إضافة للسلة (مع فحص تسجيل الدخول)
  async addToCart() {
    if (!this.book || this.isAddingToCart) return;

    // ✅ فحص: هل المستخدم مسجل دخول؟
    const isAuthenticated = this.authSession.isLoggedIn;
    
    if (!isAuthenticated) {
      // إذا مش مسجل دخول، افتح Modal التسجيل
      this.openLoginModal();
      return;
    }

    // المستخدم مسجل دخول، كمّل عملية الإضافة
    this.isAddingToCart = true;
    this.addRippleEffect();

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const cart = this.cart.getCart();
      const exists = cart.lines.some(l => l.bookId === this.book.id);

      if (exists) {
        this.cart.updateQty(this.book.id, this.qty);
        this.toastMessage = `Updated "${this.book.title}" quantity to ${this.qty}`;
      } else {
        this.cart.add(this.book.id, this.qty);
        this.toastMessage = `"${this.book.title}" (${this.qty}x) added to your cart`;
      }

      this.showToast = true;
      this.showSuccess = true;
      this.isAddingToCart = false;

      setTimeout(() => (this.showSuccess = false), 2000);
      setTimeout(() => this.hideToast(), 4000);
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
      this.isAddingToCart = false;
    }
  }

  // 🔐 فتح Modal تسجيل الدخول
  openLoginModal() {  // Changed to public for template access
    const modalRef = this.modalService.open(LandingAccountModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      windowClass: 'auth-modal-window'
    });
    
    // ابدأ على tab Login
    modalRef.componentInstance.initialTab = 'login';
    
    // بعد ما يسجل دخول، يقدر يضيف للسلة
    modalRef.result.then(
      (result) => {
        // Modal closed successfully (user logged in)
        console.log('✅ User logged in, can now add to cart');
      },
      (reason) => {
        // Modal dismissed (user canceled)
        console.log('❌ Login modal dismissed:', reason);
      }
    );
  }

  private addRippleEffect() {
    const el = document.querySelector('.gallery-main');
    if (el) {
      el.classList.add('book-ripple');
      setTimeout(() => el.classList.remove('book-ripple'), 600);
    }
  }

  hideToast() { this.showToast = false; }
}
