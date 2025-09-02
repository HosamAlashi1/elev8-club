import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit, AfterViewInit, OnDestroy {
  books: any[] = [];
  categories = [
    { title: 'Fiction' }, { title: 'Non-Fiction' }, { title: 'Mystery' },
    { title: 'Romance' }, { title: 'Science Fiction' }
  ];

  isLoading = true;
  isLoadingMore = false;
  skeletonArray = Array(6);

  private observer!: IntersectionObserver;
  private cursor = 0;
  private pageSize = 6;
  private hasNextPage = true;
  private debounceTimer: any = null;
  private scrollCheckTimer: any = null;
  private lastScrollY = 0;
  private isScrolling = false;

  @ViewChild('infiniteScrollSentinel', { static: true }) sentinel!: ElementRef;

  ngOnInit(): void {
    this.loadFirstPage();
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.scrollCheckTimer) {
      clearTimeout(this.scrollCheckTimer);
    }
    if (this.observer) {
      this.observer.disconnect();
      console.log('🧹 Observer disconnected on destroy');
    }
    // إزالة scroll listener
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    console.log('🧹 Scroll listener removed');
  }

  /** إعداد مراقب الـ scroll للتحكم بالـ fast scrolling */
  private setupScrollListener(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  /** معالج الـ scroll - يراقب السرعة ويصلح المشاكل */
  private handleScroll(): void {
    const currentScrollY = window.scrollY;
    const scrollDiff = Math.abs(currentScrollY - this.lastScrollY);
    
    // إذا الـ scroll كان سريع (أكثر من 100px)
    if (scrollDiff > 100) {
      this.isScrolling = true;
      console.log('⚡ Fast scroll detected');
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

  /** التحقق من الحاجة لتحميل المزيد بعد توقف الـ scroll */
  private checkIfNeedMoreData(): void {
    if (!this.hasNextPage || this.isLoadingMore || this.isLoading) {
      return;
    }

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    console.log('📏 Distance from bottom:', distanceFromBottom);

    // إذا المستخدم قريب من الأسفل (أقل من 800px)
    if (distanceFromBottom < 800) {
      console.log('🔄 Auto-triggering load due to proximity to bottom');
      this.loadNextPage();
    }
  }
  resetPagination(): void {
    console.log('🔄 Resetting pagination state');
    this.isLoadingMore = false;
    this.isScrolling = false;
    this.cursor = this.books.length;
    this.hasNextPage = this.cursor < 28; // عدد الكتب الإجمالي
    
    if (this.observer) {
      this.observer.disconnect();
    }
    this.setupObserver();
    
    // إعادة فحص الحاجة للمزيد من البيانات
    setTimeout(() => {
      this.checkIfNeedMoreData();
    }, 100);
  }

  /** التحقق من حالة الصفحة ومزامنة البيانات */
  private validatePaginationState(): void {
    const totalBooks = 28;
    const expectedCursor = this.books.length;
    
    if (this.cursor !== expectedCursor) {
      console.warn('⚠️ Cursor mismatch! Expected:', expectedCursor, 'Actual:', this.cursor);
      this.cursor = expectedCursor;
    }
    
    const shouldHaveNext = this.cursor < totalBooks;
    if (this.hasNextPage !== shouldHaveNext) {
      console.warn('⚠️ hasNextPage mismatch! Expected:', shouldHaveNext, 'Actual:', this.hasNextPage);
      this.hasNextPage = shouldHaveNext;
    }
    
    console.log('✅ Pagination state: cursor=', this.cursor, 'hasNext=', this.hasNextPage, 'totalLoaded=', this.books.length);
  }

  /** دالة عامة للـ debugging - يمكن استدعاؤها من الـ template */
  public debugPagination(): void {
    console.log('🐛 DEBUG INFO:');
    console.log('- Books loaded:', this.books.length);
    console.log('- Cursor:', this.cursor);
    console.log('- Has next page:', this.hasNextPage);
    console.log('- Is loading more:', this.isLoadingMore);
    console.log('- Is scrolling:', this.isScrolling);
    
    this.validatePaginationState();
    this.checkIfNeedMoreData();
  }

  /** تحميل الصفحة الأولى */
  private loadFirstPage() {
    this.fetchBooks(0).then(data => {
      this.books = data.items;
      this.hasNextPage = data.pageInfo.hasNextPage;
      this.cursor = data.pageInfo.endCursor;
      this.isLoading = false;

      console.log('📖 Page 1 loaded:', this.books.length, 'books. HasNext:', this.hasNextPage);
      this.validatePaginationState();
    }).catch(err => {
      console.error('Error loading first page:', err);
      this.isLoading = false;
    });
  }

  /** تحميل صفحات إضافية */
  private loadNextPage() {
    if (this.isLoadingMore || !this.hasNextPage) {
      console.log('⚠️ Skipping load - isLoading:', this.isLoadingMore, 'hasNext:', this.hasNextPage);
      return;
    }
    
    // تحقق إضافي من الحالة
    if (this.cursor >= 28) {
      console.log('⚠️ Cursor exceeds total books, stopping');
      this.hasNextPage = false;
      this.observer?.disconnect();
      return;
    }
    
    this.isLoadingMore = true;
    console.log('🔄 Loading next page from cursor:', this.cursor);

    this.fetchBooks(this.cursor).then(data => {
      // 🛠 لو مافي عناصر جديدة، وقف فوراً
      if (data.items.length === 0) {
        console.log('✅ No more items, stopping pagination');
        this.hasNextPage = false;
        this.isLoadingMore = false;
        this.observer?.disconnect();
        return;
      }

      // تحقق من عدم التكرار
      const existingIds = new Set(this.books.map(book => book.id));
      const newBooks = data.items.filter((book: any) => !existingIds.has(book.id));
      
      if (newBooks.length === 0) {
        console.log('⚠️ All items already exist, skipping');
        this.isLoadingMore = false;
        return;
      }

      this.books = [...this.books, ...newBooks];
      this.hasNextPage = data.pageInfo.hasNextPage;
      this.cursor = data.pageInfo.endCursor;
      this.isLoadingMore = false;

      console.log('📖 New page loaded:', newBooks.length, 'books. Total:', this.books.length, 'HasNext:', this.hasNextPage);
      this.validatePaginationState();

      if (!this.hasNextPage) {
        console.log('✅ No more pages, disconnecting observer');
        this.observer?.disconnect();
      }
    }).catch(err => {
      console.error('Error loading next page:', err);
      this.isLoadingMore = false;
    });
  }

  /** إعداد المراقب */
  private setupObserver() {
    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      console.log('👁️ Observer triggered - isIntersecting:', entry.isIntersecting, 'hasNext:', this.hasNextPage, 'isLoading:', this.isLoadingMore, 'isScrolling:', this.isScrolling);
      
      if (entry.isIntersecting && this.hasNextPage && !this.isLoadingMore && !this.isLoading) {
        // إذا كان المستخدم يعمل scroll سريع، استني شوي
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
      rootMargin: '300px', // زدت المسافة عشان يكتشف أسرع
      threshold: [0, 0.1, 0.5] // مستويات مختلفة للكشف
    });

    if (this.sentinel?.nativeElement) {
      this.observer.observe(this.sentinel.nativeElement);
      console.log('👁️ Observer setup complete');
    } else {
      console.error('❌ Sentinel element not found');
    }
  }

  /** محاكاة API */
  private async fetchBooks(cursor: number = 0): Promise<any> {
    const allBooks = [
      { id: 'book1', img: 'assets/img/landing/home/books/book1.png', title: 'The Creative Mind', author: 'Sarah Johnson', price: '$25.99', rating: 5 },
      { id: 'book2', img: 'assets/img/landing/home/books/book2.png', title: 'Future of AI', author: 'John King', price: '$32.99', rating: 4.5 },
      { id: 'book3', img: 'assets/img/landing/home/books/book3.png', title: 'Mountain Dreams', author: 'David Lee', price: '$19.95', rating: 4 },
      { id: 'book4', img: 'assets/img/landing/home/books/book4.png', title: 'Urban Tales', author: 'Rachel Smith', price: '$24.50', rating: 5 },
      { id: 'book5', img: 'assets/img/landing/home/books/book1.png', title: 'Modern Philosophy', author: 'Michael Chen', price: '$29.99', rating: 5 },
      { id: 'book6', img: 'assets/img/landing/home/books/book2.png', title: 'Digital Revolution', author: 'David Wilson', price: '$27.99', rating: 4.5 },
      { id: 'book7', img: 'assets/img/landing/home/books/book3.png', title: 'Silent Echo', author: 'Emily Parker', price: '$19.99', rating: 5 },
      { id: 'book8', img: 'assets/img/landing/home/books/book4.png', title: 'AI Tomorrow', author: 'Chris Nolan', price: '$21.50', rating: 4.2 },
      { id: 'book9', img: 'assets/img/landing/home/books/book1.png', title: 'Boundless Dreams', author: 'Nora West', price: '$22.99', rating: 4.3 },
      { id: 'book10', img: 'assets/img/landing/home/books/book2.png', title: 'Future Horizons', author: 'Alan White', price: '$26.50', rating: 4.1 },
      { id: 'book11', img: 'assets/img/landing/home/books/book3.png', title: 'The Explorer', author: 'Sophia Brown', price: '$20.95', rating: 4 },
      { id: 'book12', img: 'assets/img/landing/home/books/book4.png', title: 'City Lights', author: 'Mark Green', price: '$23.75', rating: 5 },
      { id: 'book13', img: 'assets/img/landing/home/books/book1.png', title: 'Hidden Truths', author: 'Olivia Black', price: '$25.00', rating: 4.7 },
      { id: 'book14', img: 'assets/img/landing/home/books/book2.png', title: 'Rise of Machines', author: 'Liam Gray', price: '$30.00', rating: 4.2 },
      { id: 'book15', img: 'assets/img/landing/home/books/book3.png', title: 'Peaceful Escape', author: 'Emma Davis', price: '$18.99', rating: 4 },
      { id: 'book16', img: 'assets/img/landing/home/books/book4.png', title: 'Shadows of Time', author: 'Daniel Scott', price: '$28.50', rating: 5 },
      { id: 'book17', img: 'assets/img/landing/home/books/book1.png', title: 'Wisdom Tales', author: 'Sophia Clark', price: '$24.25', rating: 4.4 },
      { id: 'book18', img: 'assets/img/landing/home/books/book2.png', title: 'Deep Learning', author: 'James Hall', price: '$33.99', rating: 4.6 },
      { id: 'book19', img: 'assets/img/landing/home/books/book3.png', title: 'River Journey', author: 'Ella Young', price: '$21.49', rating: 4 },
      { id: 'book20', img: 'assets/img/landing/home/books/book4.png', title: 'Ocean Whispers', author: 'Noah Evans', price: '$27.25', rating: 5 },
      { id: 'book21', img: 'assets/img/landing/home/books/book1.png', title: 'Bright Future', author: 'Charlotte Adams', price: '$23.99', rating: 4.1 },
      { id: 'book22', img: 'assets/img/landing/home/books/book2.png', title: 'AI & Humanity', author: 'Mason Walker', price: '$31.75', rating: 4.5 },
      { id: 'book23', img: 'assets/img/landing/home/books/book3.png', title: 'Path to Glory', author: 'Harper Lewis', price: '$20.00', rating: 4 },
      { id: 'book24', img: 'assets/img/landing/home/books/book4.png', title: 'Golden Age', author: 'Amelia King', price: '$29.00', rating: 5 },
      { id: 'book25', img: 'assets/img/landing/home/books/book1.png', title: 'Infinite Imagination', author: 'Henry Allen', price: '$24.75', rating: 4.6 },
      { id: 'book26', img: 'assets/img/landing/home/books/book2.png', title: 'Mind Over Matter', author: 'Grace Thomas', price: '$28.99', rating: 4.3 },
      { id: 'book27', img: 'assets/img/landing/home/books/book3.png', title: 'Wild Adventures', author: 'Lucas Baker', price: '$22.40', rating: 4 },
      { id: 'book28', img: 'assets/img/landing/home/books/book4.png', title: 'Legends Reborn', author: 'Isabella Turner', price: '$26.80', rating: 5 },
    ];

    console.log('🔍 fetchBooks called with cursor:', cursor, 'Total books available:', allBooks.length);

    // تأكد من أن الـ cursor صحيح
    if (cursor >= allBooks.length) {
      console.log('✅ Cursor exceeds total books, returning empty');
      return {
        items: [],
        pageInfo: { endCursor: cursor, hasNextPage: false }
      };
    }

    const endIndex = Math.min(cursor + this.pageSize, allBooks.length);
    const slice = allBooks.slice(cursor, endIndex);

    console.log('📊 Slicing from', cursor, 'to', endIndex, '- got', slice.length, 'items');

    const nextCursor = endIndex;
    const hasNext = nextCursor < allBooks.length;

    console.log('📝 Next cursor will be:', nextCursor, 'HasNext:', hasNext);

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          items: slice,
          pageInfo: { endCursor: nextCursor, hasNextPage: hasNext }
        });
      }, 800);
    });
  }
}
