import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../services/toater.service';
import { PublicService } from '../../services/public.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { ApiService } from '../../services/api.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class CategoriesComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  categories: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  typeFilter: string = '';

  // Options for type filter
  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'meal', label: 'Meal' },
    { value: 'restaurant', label: 'Restaurant' }
  ];

  constructor(
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal,
    private api: ApiService,
    private httpService: HttpService
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
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
    const payload = {
      perPage: this.size,
      page: this.page,
      search: this.searchText.trim(),
      type: this.typeFilter || undefined
    };

    const url = `${this.api.category.list}`;
    this.httpService.list(url, payload, 'categoriesList').subscribe({
      next: (res) => {
        if (res?.status && res?.items?.data) {
          this.categories = res.items.data.map((c: any) => ({
            ...c,
            name: c.title, // Map title to name for consistency
            image: c.image || 'assets/img/blank.png'
          }));
          this.totalCount = res.items.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load categories');
        this.isLoading$.next(false);
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }


  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.typeFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  add(): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.category = item;
    modalRef.result.then(() => this.list(this.page));
  }

  delete(item: any): void {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'category';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} ?`;
    modalRef.result.then(() => this.list(this.page));
  }

  openImageModal(image: string): void {
    this.publicService.openImage('Category Image', image);
  }
}
