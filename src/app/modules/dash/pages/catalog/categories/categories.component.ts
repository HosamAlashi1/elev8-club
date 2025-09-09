import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../../services/public.service';
import { AddEditCategoryComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

type CategoryStatus = 'active' | 'inactive';

interface Category {
  id: number;
  icon: string;
  name: string;
  description: string;
  books: number;
  status: CategoryStatus;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(true);
  categories: Category[] = [];
  totalCount = 0;
  statusFilter: '' | CategoryStatus = '';

  statusOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  selectedIds = new Set<number>();
  selectAll = false;

  private readonly MOCK_CATEGORIES: Category[] = [
    {
      id: 1,
      icon: 'assets/img/landing/home/categories/icon1.png',
      name: 'Fiction',
      description: 'General fiction literature including novels and short stories',
      books: 1245,
      status: 'active'
    },
    {
      id: 2,
      icon: 'assets/img/landing/home/categories/icon2.png',
      name: 'Non-Fiction',
      description: 'Educational and informative books across various subjects',
      books: 892,
      status: 'active'
    },
    {
      id: 3,
      icon: 'assets/img/landing/home/categories/icon3.png',
      name: 'Children\'s Books',
      description: 'Books for young readers aged 0-12 years',
      books: 567,
      status: 'active'
    },
    {
      id: 4,
      icon: 'assets/img/landing/home/categories/icon4.png',
      name: 'Academic',
      description: 'Textbooks and educational materials',
      books: 328,
      status: 'active'
    },

    {
      id: 5,
      icon: 'assets/img/landing/home/categories/icon5.png',
      name: 'Comics & Graphic Novels',
      description: 'Comic books, manga, and graphic novels',
      books: 423,
      status: 'inactive'
    }
  ];

  constructor(private publicService: PublicService , private modalService: NgbModal) {
    this.size = this.publicService.getNumOfRows(505, 61);
    
  }

  ngOnInit(): void {
    this.loadData();
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

    setTimeout(() => {
      const term = this.searchText.trim().toLowerCase();
      let data = [...this.MOCK_CATEGORIES];

      if (this.statusFilter) {
        data = data.filter(c => c.status === this.statusFilter);
      }

      if (term) {
        data = data.filter(c =>
          c.name.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
        );
      }

      this.totalCount = data.length;
      const start = (this.page - 1) * this.size;
      const end = start + this.size;
      this.categories = data.slice(start, end);

      this.isLoading$.next(false);
    }, 600);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.list(this.page);
  }

  getStatusPillClass(status: CategoryStatus): string {
    return status === 'active' ? 'pill-success' : 'pill-secondary';
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedIds.clear();
    if (this.selectAll) this.categories.forEach(c => this.selectedIds.add(c.id));
  }

  toggleRow(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.selectAll = this.selectedIds.size === this.categories.length && this.categories.length > 0;
  }

  bulkArchive(): void {
    alert(`Archive: [${[...this.selectedIds].join(', ')}]`);
  }

  bulkDelete(): void {
    alert(`Delete: [${[...this.selectedIds].join(', ')}]`);
  }

  add() {
    const modalRef = this.modalService.open(AddEditCategoryComponent, { size: 'md', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditCategoryComponent, { size: 'md', centered: true });
    modalRef.componentInstance.category = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'category';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} category ?`;
    modalRef.result.then(() => this.list(1));
  }
}
