import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() isLoading$: Observable<boolean>;
  @Input() totalRecords: number = 0;
  @Input() disabled: boolean = false;
  @Input() size: number = 10;
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  currentPage: number = 1;
  totalPages: number = 1;
  maxVisiblePages = 3;

  ngOnChanges(changes: SimpleChanges): void {
    this.totalPages = Math.ceil(this.totalRecords / this.size);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  get pages(): number[] {
    const pages: number[] = [];
    if (this.totalPages <= this.maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(this.maxVisiblePages / 2);
      let start = Math.max(this.currentPage - half, 1);
      let end = start + this.maxVisiblePages - 1;

      if (end > this.totalPages) {
        end = this.totalPages;
        start = Math.max(end - this.maxVisiblePages + 1, 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.pageChange.emit(this.currentPage);
  }

  isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  isLastPage(): boolean {
    return this.currentPage === this.totalPages;
  }
}
