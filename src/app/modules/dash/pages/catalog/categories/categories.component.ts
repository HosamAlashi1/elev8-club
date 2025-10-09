import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../../services/public.service';
import { AddEditCategoryComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { ToastrsService } from '../../../../services/toater.service';

type CategoryStatus = 'active' | 'inactive';

interface Category {
  id: number;
  image: string;
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

  constructor(
    public publicService: PublicService,
    private modalService: NgbModal,
    private http: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) {
    this.size = this.publicService.getNumOfRows(505, 61);
  }

  ngOnInit(): void {
    this.list(this.page);
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    const status = this.statusFilter;
    return `${this.api.categories.list}?q=${q}&status=${status}&size=${this.size}&page=${this.page}`;
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    const url = this.buildUrl();
    this.http.listGet(url, 'categories-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.totalCount = res.data.total_count ?? 0;
          this.categories = (res.data.data || []) as Category[];
        } else {
          this.totalCount = 0;
          this.categories = [];
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.totalCount = 0;
        this.categories = [];
        this.isLoading$.next(false);
      }
    });
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
    this.statusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  getStatusPillClass(status: CategoryStatus): string {
    return status === 'active' ? 'pill-success' : 'pill-secondary';
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
    modalRef.result.then((res) => {
      if (res === 'deleted') this.list(1);
    });
  }
}
