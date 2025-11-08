import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ApiLandingService } from '../../..//services/api.landing.service';
import { HttpService } from 'src/app/modules/services/http.service';

type SortKey = 'featured' | 'low' | 'high' | 'newest' | 'rating';

interface ApiBookItem {
  id: number;
  title: string;
  price: number;
  rating_avg: number;
  cover_image: string;
  author: string;
}

interface BookViewModel {
  id: number;
  title: string;
  price: number;
  rating: number;
  img: string;
  author: string;
}

interface CategoryItem {
  id: number;
  name: string;
  image: string;
  selected?: boolean; // لتتبع الاختيار
}

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit, AfterViewInit, OnDestroy {
  // ========= UI State =========
  books: BookViewModel[] = [];
  categories: CategoryItem[] = []; // هنا بنستقبل الفئات من الـ API
  isLoading = true;        // للصفحة الأولى
  isLoadingMore = false;   // للتحميل اللامتناهي
  errormessage = '';
  skeletonArray = Array(6);

  // ========= Filters / Query =========
  q = '';
  selectedCategoryIds: number[] = []; // الفئات المختارة كـ IDs
  min_price = 0;
  max_price = 0;
  bestsellers = 0;       // 0 أو 1
  sort: SortKey = 'featured';

  // ========= Pagination =========
  page = 1;
  size = 6;             // حسب المطلوب
  totalRecords = 0;

  // ========= Infinite Scroll =========
  private observer!: IntersectionObserver;
  @ViewChild('infiniteScrollSentinel', { static: true }) sentinel!: ElementRef;

  // ========= Scroll Management =========
  private debounceTimer: any = null;
  private scrollCheckTimer: any = null;
  private lastScrollY = 0;
  private isScrolling = false;

  constructor(
    private api: ApiLandingService,
    private http: HttpService
  ) { }

  // ========= Lifecycle =========
  ngOnInit(): void {
    this.loadCategories(); // تحميل الفئات أولاً
    this.loadFirstPage();
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.scrollCheckTimer) clearTimeout(this.scrollCheckTimer);
    if (this.observer) this.observer.disconnect();
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  // ========= Public Handlers (Filters / Sort / Search) =========
  onSearchChange(term: string) {
    this.q = term ?? '';
    this.resetAndReload();
  }

  onToggleBestsellers(checked: boolean) {
    this.bestsellers = checked ? 1 : 0;
    this.resetAndReload();
  }

  onPriceChange(min?: number, max?: number) {
    this.min_price = Number(min || 0);
    this.max_price = Number(max || 0);
    this.resetAndReload();
  }

  onSortChange(s: SortKey) {
    this.sort = s;
    this.resetAndReload();
  }

  onCategoryToggle(categoryId: number, checked: boolean) {
    if (checked) {
      // أضف الـ ID للمصفوفة
      if (!this.selectedCategoryIds.includes(categoryId)) {
        this.selectedCategoryIds.push(categoryId);
      }
    } else {
      // احذف الـ ID من المصفوفة
      this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    }

    console.log('📂 Selected categories:', this.selectedCategoryIds);
    this.resetAndReload();
  }

  // ========= Debug Helper (للاستخدام من الـ console أو template) =========
  public debugPagination(): void {
    console.log('🐛 DEBUG INFO:');
    console.log('- Books loaded:', this.books.length);
    console.log('- Current page:', this.page);
    console.log('- Total records:', this.totalRecords);
    console.log('- Has next page:', this.hasNextPage());
    console.log('- Is loading more:', this.isLoadingMore);
    console.log('- Is scrolling:', this.isScrolling);
    console.log('- Expected pages:', Math.ceil(this.totalRecords / this.size));

    this.checkIfNeedMoreData();
  }

  // ========= Scroll Management (للـ Fast Scrolling) =========
  private setupScrollListener(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  private handleScroll(): void {
    const currentScrollY = window.scrollY;
    const scrollDiff = Math.abs(currentScrollY - this.lastScrollY);

    // إذا الـ scroll سريع (أكثر من 100px)
    if (scrollDiff > 100) {
      this.isScrolling = true;
    }

    this.lastScrollY = currentScrollY;

    // إعادة تعيين حالة الـ scrolling بعد توقف
    if (this.scrollCheckTimer) {
      clearTimeout(this.scrollCheckTimer);
    }

    this.scrollCheckTimer = setTimeout(() => {
      this.isScrolling = false;
      this.checkIfNeedMoreData();
    }, 150);
  }

  private checkIfNeedMoreData(): void {
    if (!this.hasNextPage() || this.isLoadingMore || this.isLoading) {
      return;
    }

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    // إذا المستخدم قريب من الأسفل (أقل من 800px)
    if (distanceFromBottom < 800) {
      console.log('🔄 Auto-triggering load due to proximity to bottom');
      this.loadNextPage();
    }
  }

  // ========= Loading Flows =========
  private loadCategories() {
    const url = this.api.common.categories;

    this.http.listGet(url, 'categories').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data && Array.isArray(res.data)) {
          this.categories = res.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            image: cat.image,
            selected: false
          }));
          console.log('📂 Categories loaded:', this.categories.length);
        } else {
          console.error('Failed to load categories:', res?.message);
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  private resetAndReload() {
    // أعد التهيئة
    this.page = 1;
    this.totalRecords = 0;
    this.books = [];
    this.errormessage = '';
    this.isLoading = true;
    this.isLoadingMore = false;
    this.isScrolling = false;

    // أعد مراقب الإنفنت سكرول
    if (this.observer) {
      this.observer.disconnect();
    }

    // حمّل الصفحة الأولى بالباراميترات الجديدة
    this.fetchBooks(this.page).then(({ items, total }) => {
      this.books = items;
      this.totalRecords = total;
      this.isLoading = false;

      console.log('📖 Reset complete:', this.books.length, 'books loaded. Total:', this.totalRecords);

      // إعادة تفعيل الـ observer
      setTimeout(() => {
        this.setupObserver();
        this.checkIfNeedMoreData();
      }, 100);
    }).catch(err => {
      console.error('Failed to reload:', err);
      this.errormessage = 'Failed to load books.';
      this.isLoading = false;
      this.observer?.disconnect();
    });
  }

  private loadFirstPage() {
    this.isLoading = true;
    this.errormessage = '';
    this.page = 1;

    this.fetchBooks(this.page).then(({ items, total }) => {
      this.books = items;
      this.totalRecords = total;
      this.isLoading = false;

      console.log('📖 First page loaded:', this.books.length, 'books. Total:', this.totalRecords, 'HasNext:', this.hasNextPage());

      // تحقق من الحاجة لتحميل المزيد بعد التحميل الأول
      setTimeout(() => {
        this.checkIfNeedMoreData();
      }, 200);
    }).catch(err => {
      console.error('Error loading first page:', err);
      this.errormessage = 'Failed to load books.';
      this.isLoading = false;
      this.observer?.disconnect();
    });
  }

  private loadNextPage() {
    if (this.isLoadingMore || !this.hasNextPage()) {
      console.log('⚠️ Skipping load - isLoading:', this.isLoadingMore, 'hasNext:', this.hasNextPage());
      return;
    }

    this.isLoadingMore = true;
    const nextPage = this.page + 1;

    console.log('🔄 Loading page', nextPage, 'Current total:', this.books.length, 'of', this.totalRecords);

    this.fetchBooks(nextPage).then(({ items }) => {
      // لو مافي عناصر جديدة، وقف
      if (items.length === 0) {
        console.log(' No more items returned from API');
        this.isLoadingMore = false;
        this.observer?.disconnect();
        return;
      }

      // منع التكرار
      const existing = new Set(this.books.map(b => b.id));
      const unique = items.filter(b => !existing.has(b.id));

      if (unique.length === 0) {
        console.log('⚠️ All items already exist, skipping');
        this.isLoadingMore = false;
        return;
      }

      this.books = [...this.books, ...unique];
      this.page = nextPage;
      this.isLoadingMore = false;

      console.log('📖 Page', nextPage, 'loaded:', unique.length, 'new books. Total:', this.books.length, 'of', this.totalRecords);

      // إذا وصلنا للنهاية، افصل الـ observer
      if (!this.hasNextPage()) {
        console.log(' All books loaded, disconnecting observer');
        this.observer?.disconnect();
      } else {
        // تحقق إذا محتاجين نحمل أكثر
        setTimeout(() => {
          this.checkIfNeedMoreData();
        }, 100);
      }
    }).catch(err => {
      console.error('Error loading next page:', err);
      this.isLoadingMore = false;
    });
  }

  private hasNextPage(): boolean {
    const loaded = this.page * this.size;
    return loaded < this.totalRecords;
  }

  // ========= Infinite Scroll Observer =========
  private setupObserver() {
    // افصل القديم لو موجود
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      console.log('👁️ Observer triggered - isIntersecting:', entry.isIntersecting,
        'hasNext:', this.hasNextPage(),
        'isLoading:', this.isLoadingMore,
        'isScrolling:', this.isScrolling);

      if (entry.isIntersecting && !this.isLoading && !this.isLoadingMore && this.hasNextPage()) {
        // إذا كان scroll سريع، استني شوي
        const delay = this.isScrolling ? 300 : 100;

        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
          console.log('🚀 Triggering next page load after debounce (delay:', delay, 'ms)');
          this.loadNextPage();
        }, delay);
      }
    }, {
      rootMargin: '400px',      // زدت المسافة للكشف المبكر
      threshold: [0, 0.1, 0.5]  // مستويات متعددة
    });

    if (this.sentinel?.nativeElement) {
      this.observer.observe(this.sentinel.nativeElement);
      console.log('👁️ Observer setup complete');
    } else {
      console.warn('⚠️ Sentinel element not found');
    }
  }

  // ========= API Caller =========
  private async fetchBooks(page: number): Promise<{ items: BookViewModel[]; total: number }> {
    const url = this.buildShopUrl({
      q: this.q,
      categories: this.selectedCategoryIds.join(','), // تحويل المصفوفة لـ string
      min_price: this.min_price,
      max_price: this.max_price,
      bestsellers: this.bestsellers,
      sort: this.sort,
      size: this.size,
      page
    });

    // نستخدم HttpService.listGet للتحميل مع سبينر/سكلتون اختياريًا عبر key
    return new Promise((resolve, reject) => {
      this.http.listGet(url, page === 1 ? 'shop_first' : 'shop_more').subscribe({
        next: (res: any) => {
          if (res?.status && res?.data?.data && Array.isArray(res.data.data)) {
            const raw: ApiBookItem[] = res.data.data;
            const items: BookViewModel[] = raw.map(b => ({
              id: b.id,
              title: b.title,
              price: b.price,
              rating: b.rating_avg,
              img: b.cover_image,
              author: b.author
            }));
            // total_count = العدد الإجمالي للكتب (10)
            // total_records = عدد العناصر في الصفحة الحالية (6)
            const total = Number(res.data.total_count || res.data.total_records || items.length);

            console.log('📊 API Response - total_count:', res.data.total_count,
              'total_records:', res.data.total_records,
              'items:', items.length,
              'Using total:', total);

            resolve({ items, total });
          } else {
            reject(new Error(res?.message || 'Invalid response'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  private buildShopUrl(params: {
    q: string;
    categories: string; // الفئات كـ string مفصولة بفاصلة
    min_price: number;
    max_price: number;
    bestsellers: number; // 0 | 1
    sort: SortKey;
    size: number;
    page: number;
  }): string {
    const qs = new URLSearchParams({
      q: params.q ?? '',
      categories: params.categories ?? '', // إضافة الفئات
      min_price: String(params.min_price ?? 0),
      max_price: String(params.max_price ?? 0),
      bestsellers: String(params.bestsellers ?? 0),
      sort: params.sort,
      size: String(params.size ?? 6),
      page: String(params.page ?? 1),
    });
    // مثال: /website/shop?q=&categories=1,2,3&min_price=0&max_price=0&bestsellers=0&sort=featured&size=6&page=1
    return `${this.api.books.list}?${qs.toString()}`;
  }

  resetFilters(): void {
    // Clear all filters
    this.q = '';
    this.selectedCategoryIds = [];
    this.min_price = 0;
    this.max_price = 0;
    this.bestsellers = 0;
    this.sort = 'featured';

    // Uncheck all category checkboxes manually if needed
    this.categories = this.categories.map(c => ({ ...c, selected: false }));

    // Reset any inputs in the template
    const minInput = document.querySelector<HTMLInputElement>('input[placeholder="Min"]');
    const maxInput = document.querySelector<HTMLInputElement>('input[placeholder="Max"]');
    const bestsellerInput = document.querySelector<HTMLInputElement>('#bestsellers');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    if (bestsellerInput) bestsellerInput.checked = false;

    // Finally reload the first page
    this.resetAndReload();
  }

}
