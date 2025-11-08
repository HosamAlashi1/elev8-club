import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../../services/public.service';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { ToastrsService } from '../../../../services/toater.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddEditBookComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { AdvancedFiltersComponent } from './advanced-filters/advanced-filters.component';

type BookStatus = 'active' | 'inactive';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  category: string;
  status?: BookStatus;
  cover_image?: string;
}

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {

  // ===== Reactive state =====
  isLoading$ = new BehaviorSubject<boolean>(true);
  books: Book[] = [];
  totalCount = 0;

  // ===== Filters & pagination =====
  page = 1;
  size = 10;
  searchText = '';
  categoryId = 0; // placeholder for category filter if added later
  searchChanged: Subject<string> = new Subject<string>();

  // ===== Advanced Filters =====
  author_id: number | null = null;
  category_id_filter: number | null = null;
  lowestPrice: number | null = null;
  highestPrice: number | null = null;

  // ===== UI settings =====
  sizeOptions: { value: number; label: string }[] = [];

  // ===== Selection (bulk actions) =====
  selectedIds = new Set<number>();
  selectAll = false;

  constructor(
    public publicService: PublicService,
    private modalService: NgbModal,
    private http: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) {
    // auto calculate rows count depending on window height
    this.size = this.publicService.getNumOfRows(505, 93);

    this.sizeOptions = [
      { value: this.size, label: `${this.size} rows` },
      { value: 10, label: '10 rows' },
      { value: 25, label: '25 rows' },
      { value: 50, label: '50 rows' },
      { value: 100, label: '100 rows' },
      { value: 250, label: '250 rows' },
      { value: 500, label: '500 rows' }
    ];
  }

  ngOnInit(): void {
    this.list(this.page);

    // search debounce
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  // ===== Build API URL =====
  private buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    let url = `${this.api.books.list}?q=${q}&size=${this.size}&page=${this.page}`;

    // Add advanced filters to URL
    if (this.author_id !== null && this.author_id !== undefined) {
      url += `&author_id=${this.author_id}`;
    }

    if (this.category_id_filter !== null && this.category_id_filter !== undefined) {
      url += `&category_id=${this.category_id_filter}`;
    }

    if (this.lowestPrice !== null && this.lowestPrice !== undefined) {
      url += `&lowest_price=${this.lowestPrice}`;
    }

    if (this.highestPrice !== null && this.highestPrice !== undefined) {
      url += `&highest_price=${this.highestPrice}`;
    }

    return url;
  }

  // ===== Main list method =====
  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);
    this.selectedIds.clear();
    this.selectAll = false;

    const url = this.buildUrl();

    this.http.listGet(url, 'books-list').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          this.totalCount = res.data.total_count ?? 0;
          this.books = (res.data.data || []) as Book[];
        } else {
          this.totalCount = 0;
          this.books = [];
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.totalCount = 0;
        this.books = [];
        this.isLoading$.next(false);
        this.toastr.showError('Failed to load books list');
      }
    });
  }

  // ===== Pagination, search, filters =====
  onSizeChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.size = this.publicService.getNumOfRows(505, 93);

    // Reset advanced filters
    this.author_id = null;
    this.category_id_filter = null;
    this.lowestPrice = null;
    this.highestPrice = null;

    this.list(this.page);
  }

  // ===== Open Advanced Filters Modal =====
  openFiltersModal(): void {
    const modalRef = this.modalService.open(AdvancedFiltersComponent, { size: 'lg', centered: true });

    // Pass current filter values to modal
    modalRef.componentInstance.author_id = this.author_id;
    modalRef.componentInstance.category_id = this.category_id_filter;
    modalRef.componentInstance.lowestPrice = this.lowestPrice;
    modalRef.componentInstance.highestPrice = this.highestPrice;

    // Handle result
    modalRef.result.then((filters: any) => {
      if (filters) {
        this.author_id = filters.author_id;
        this.category_id_filter = filters.category_id;
        this.lowestPrice = filters.lowestPrice;
        this.highestPrice = filters.highestPrice;

        // Reload data with new filters
        this.page = 1;
        this.list(this.page);
      }
    }).catch(() => {
      // Modal dismissed
    });
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

  // ===== Selection =====
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

  // ===== Bulk actions =====
  bulkArchive(): void {
    if (this.selectedIds.size === 0) {
      this.toastr.showWarning('No books selected');
      return;
    }
    const ids = [...this.selectedIds].join(', ');
    this.toastr.showSuccess(`Bulk archive triggered for books: [${ids}]`);
  }

  // ===== Utilities =====
  openImageModal(image: string) {
    this.publicService.openImage('Book Cover', image);
  }

  add() {
    const modalRef = this.modalService.open(AddEditBookComponent, { size: 'lg', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditBookComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.book = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'book';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} book ?`;
    modalRef.result.then((res) => {
      if (res === 'deleted') this.list(1);
    });
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) {
      this.toastr.showWarning('Please select at least one book to delete.');
      return;
    }

    const modalRef = this.modalService.open(DeleteComponent, { centered: true });
    modalRef.componentInstance.type = 'book-delete-all';
    modalRef.componentInstance.message = `Do you want to delete ${this.selectedIds.size} selected books?`;
    modalRef.componentInstance.id = 0; // مش مستخدم، بس لازم لأن المودال بيطلبه

    // ✨ نمرر المعرّفات للمودال نفسه عشان يرسلها بالـ body
    modalRef.componentInstance.extraData = {
      book_ids: Array.from(this.selectedIds)
    };

    modalRef.result.then((res) => {
      if (res === 'deleted') {
        this.toastr.showSuccess('Selected books deleted successfully.');
        this.list(this.page);
      }
    }).catch(() => { });
  }

}
