import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../../services/public.service';

type BookStatus = 'active' | 'inactive';

interface Book {
  id: number;
  title: string;
  author_name: string;
  isbn: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
  cover: string;
}


@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {

  // loading & data
  isLoading$ = new BehaviorSubject<boolean>(true);
  books: Book[] = [];
  totalCount = 0;

  // paging & search
  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  // filters (مكان جاهز للتوسع لاحقًا)
  statusFilter: '' | BookStatus = '';

  // selection (Bulk actions)
  selectedIds = new Set<number>();
  selectAll = false;

  // ===== MOCK DATA =====
  private readonly MOCK_BOOKS: Book[] = [
    {
      id: 101,
      title: 'The Great Adventure',
      author_name: 'John Smith',
      isbn: '978-3-16-148410-0',
      price: 29.99,
      stock: 15,
      category: 'Fiction',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book1.png'
    },
    {
      id: 102,
      title: 'Business Strategy',
      author_name: 'Jane Doe',
      isbn: '978-3-16-148410-1',
      price: 49.99,
      stock: 5,
      category: 'Academic',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book2.png'
    },
    {
      id: 103,
      title: 'Cooking Basics',
      author_name: 'Mike Johnson',
      isbn: '978-3-16-148410-2',
      price: 34.99,
      stock: 0,
      category: 'Non-fiction',
      status: 'inactive',
      cover: 'assets/img/dashboard/catalog/books/book3.png'
    },
    {
      id: 101,
      title: 'The Great Adventure',
      author_name: 'John Smith',
      isbn: '978-3-16-148410-0',
      price: 29.99,
      stock: 15,
      category: 'Fiction',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book1.png'
    },
    {
      id: 102,
      title: 'Business Strategy',
      author_name: 'Jane Doe',
      isbn: '978-3-16-148410-1',
      price: 49.99,
      stock: 5,
      category: 'Academic',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book2.png'
    },
    {
      id: 103,
      title: 'Cooking Basics',
      author_name: 'Mike Johnson',
      isbn: '978-3-16-148410-2',
      price: 34.99,
      stock: 0,
      category: 'Non-fiction',
      status: 'inactive',
      cover: 'assets/img/dashboard/catalog/books/book3.png'
    },
    {
      id: 101,
      title: 'The Great Adventure',
      author_name: 'John Smith',
      isbn: '978-3-16-148410-0',
      price: 29.99,
      stock: 15,
      category: 'Fiction',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book1.png'
    },
    {
      id: 102,
      title: 'Business Strategy',
      author_name: 'Jane Doe',
      isbn: '978-3-16-148410-1',
      price: 49.99,
      stock: 5,
      category: 'Academic',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book2.png'
    },
    {
      id: 103,
      title: 'Cooking Basics',
      author_name: 'Mike Johnson',
      isbn: '978-3-16-148410-2',
      price: 34.99,
      stock: 0,
      category: 'Non-fiction',
      status: 'inactive',
      cover: 'assets/img/dashboard/catalog/books/book3.png'
    },
    {
      id: 101,
      title: 'The Great Adventure',
      author_name: 'John Smith',
      isbn: '978-3-16-148410-0',
      price: 29.99,
      stock: 15,
      category: 'Fiction',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book1.png'
    },
    {
      id: 102,
      title: 'Business Strategy',
      author_name: 'Jane Doe',
      isbn: '978-3-16-148410-1',
      price: 49.99,
      stock: 5,
      category: 'Academic',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book2.png'
    },
    {
      id: 103,
      title: 'Cooking Basics',
      author_name: 'Mike Johnson',
      isbn: '978-3-16-148410-2',
      price: 34.99,
      stock: 0,
      category: 'Non-fiction',
      status: 'inactive',
      cover: 'assets/img/dashboard/catalog/books/book3.png'
    },
    {
      id: 101,
      title: 'The Great Adventure',
      author_name: 'John Smith',
      isbn: '978-3-16-148410-0',
      price: 29.99,
      stock: 15,
      category: 'Fiction',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book1.png'
    },
    {
      id: 102,
      title: 'Business Strategy',
      author_name: 'Jane Doe',
      isbn: '978-3-16-148410-1',
      price: 49.99,
      stock: 5,
      category: 'Academic',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book2.png'
    },
    {
      id: 103,
      title: 'Cooking Basics',
      author_name: 'Mike Johnson',
      isbn: '978-3-16-148410-2',
      price: 34.99,
      stock: 0,
      category: 'Non-fiction',
      status: 'inactive',
      cover: 'assets/img/dashboard/catalog/books/book3.png'
    },
    {
      id: 101,
      title: 'The Great Adventure',
      author_name: 'John Smith',
      isbn: '978-3-16-148410-0',
      price: 29.99,
      stock: 15,
      category: 'Fiction',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book1.png'
    },
    {
      id: 102,
      title: 'Business Strategy',
      author_name: 'Jane Doe',
      isbn: '978-3-16-148410-1',
      price: 49.99,
      stock: 5,
      category: 'Academic',
      status: 'active',
      cover: 'assets/img/dashboard/catalog/books/book2.png'
    },
    {
      id: 103,
      title: 'Cooking Basics',
      author_name: 'Mike Johnson',
      isbn: '978-3-16-148410-2',
      price: 34.99,
      stock: 0,
      category: 'Non-fiction',
      status: 'inactive',
      cover: 'assets/img/dashboard/catalog/books/book3.png'
    },];


  constructor(private publicService: PublicService) {
    // نفس منطقك لحساب الصفوف المعروضة
    this.size = this.publicService.getNumOfRows(505, 93);
  }

  ngOnInit(): void {
    this.loadData();

    // ديباونس للبحث
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  loadData(): void {
    this.list(this.page);
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);
    this.selectedIds.clear();
    this.selectAll = false;

    // محاكاة API: فلترة + بحث + تقسيم صفحات + تأخير بسيط لعرض اللودر/السكلتون
    setTimeout(() => {
      const term = this.searchText.trim().toLowerCase();

      let data = [...this.MOCK_BOOKS];

      if (this.statusFilter) {
        data = data.filter(b => b.status === this.statusFilter);
      }

      if (term) {
        data = data.filter(b =>
          b.title.toLowerCase().includes(term) ||
          b.author_name.toLowerCase().includes(term) ||
          b.isbn.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term)
        );
      }

      this.totalCount = data.length;

      const start = (this.page - 1) * this.size;
      const end = start + this.size;
      this.books = data.slice(start, end);

      this.isLoading$.next(false);
    }, 600);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  reset(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  // ===== UI helpers =====
  getStockClass(stock: number): string {
    if (stock === 0) return 'text-danger fw-semibold';
    if (stock <= 5) return 'text-warning fw-semibold';
    return 'text-muted';
  }

  getStatusPillClass(status: BookStatus): string {
    return status === 'active' ? 'pill-success' : 'pill-secondary';
  }

  // selection
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedIds.clear();
    if (this.selectAll) this.books.forEach(b => this.selectedIds.add(b.id));
  }

  toggleRow(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.selectAll = this.selectedIds.size === this.books.length && this.books.length > 0;
  }

  // bulk action example (placeholder)
  bulkArchive(): void {
    // محاكاة أكشن جماعي
    alert(`Bulk action on: [${[...this.selectedIds].join(', ')}]`);
  }

  openImageModal(image: string) {
    this.publicService.openImage('Book Cover', image);
  }
}
