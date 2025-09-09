import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, HostListener } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit, OnChanges {
  @Input() isLoading$: Observable<boolean>;
  @Input() totalRecords = 0;
  @Input() disabled = false;
  @Input() size = 10;
  @Output() pageChange = new EventEmitter<number>();

  currentPage = 1;
  totalPages = 1;

  // يتغير حسب حجم الشاشة
  maxVisiblePages = 7;
  isMobile = false;

  ngOnInit(): void {
    this.updateResponsive();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateResponsive();
  }

  private updateResponsive() {
    this.isMobile = window.innerWidth <= 768;
    this.maxVisiblePages = this.isMobile ? 3 : 7;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.size));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const max = Math.min(this.maxVisiblePages, this.totalPages);

    // نافذة متحركة حول الصفحة الحالية
    const half = Math.floor(max / 2);
    let start = Math.max(this.currentPage - half, 1);
    let end = start + max - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(end - max + 1, 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.pageChange.emit(this.currentPage);
  }

  isFirstPage(): boolean { return this.currentPage === 1; }
  isLastPage(): boolean { return this.currentPage === this.totalPages; }
}
