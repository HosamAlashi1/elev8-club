import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../services/public.service';
import { ToastrsService } from '../../services/toater.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css'],
})
export class OptionsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  options: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  typeFilter: string = '';

  // Options for type filter
  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'delivery_fee', label: 'Delivery Fee' },
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price' }
  ];

  constructor(
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal,
    private api: ApiService,
    private httpService: HttpService
  ) {
    this.size = this.publicService.getNumOfRows(313, 64);
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

    const url = `${this.api.options.list}`;
    this.httpService.list(url, payload, 'optionsList').subscribe({
      next: (res) => {
        if (res?.status && res?.items?.data) {
          this.options = res.items.data.map((option: any) => ({
            ...option,
            typeDisplay: this.getTypeDisplay(option.type)
          }));
          this.totalCount = res.items.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load options');
        this.isLoading$.next(false);
      }
    });
  }

  getTypeDisplay(type: string): string {
    switch (type) {
      case 'delivery_fee':
        return 'Delivery Fee';
      case 'rating':
        return 'Rating';
      case 'price':
        return 'Price';
      default:
        return type;
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'delivery_fee':
        return 'bg-primary';
      case 'rating':
        return 'bg-warning';
      case 'price':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
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

  add() {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.option = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'option';
    modalRef.componentInstance.message = `Do you want to delete option "${item.name}" ?`;
    modalRef.result.then(() => this.list(1));
  }
}
