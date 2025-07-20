import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-meals',
  templateUrl: './meals.component.html',
  styleUrls: ['./meals.component.css'],
})
export class MealsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  meals: any[] = [];
  categories: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  restaurantName = '';
  restaurantId!: number;

  // Filters
  categoryFilter: string = '';
  isPopularFilter: string = '';
  statusFilter: string = '';

  // Filter options
  categoryOptions: any[] = [{ value: '', label: 'All Categories' }];
  isPopularOptions = [
    { value: '', label: 'All' },
    { value: '1', label: 'Popular' },
    { value: '0', label: 'Not Popular' }
  ];
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' }
  ];

  constructor(
    private modalService: NgbModal,
    private publicService: PublicService,
    private toastr: ToastrsService,
    private route: ActivatedRoute,
    private api: ApiService,
    private httpService: HttpService
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
  }

  ngOnInit(): void {
    this.restaurantId = +this.route.snapshot.paramMap.get('restaurantId')!;
    this.restaurantName = history.state.restaurantName || 'Unknown Restaurant';
    this.loadCategories();
    this.loadData();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  loadCategories(): void {
    const payload = {
      perPage: 100,
      page: 1,
      type: 'meal'
    };

    this.httpService.list(this.api.category.list, payload, 'categoriesList').subscribe({
      next: (res) => {
        if (res?.status && res?.items?.data) {
          const categories = res.items.data.map((c: any) => ({
            value: c.id.toString(),
            label: c.title
          }));
          this.categoryOptions = [{ value: '', label: 'All Categories' }, ...categories];
        }
      },
      error: () => {
        // Fallback categories if API fails
        this.categoryOptions = [
          { value: '', label: 'All Categories' },
          { value: '1', label: 'Appetizers' },
          { value: '2', label: 'Main Course' },
          { value: '3', label: 'Desserts' }
        ];
      }
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
      restaurant_id: this.restaurantId,
      category_id: this.categoryFilter || undefined,
      is_popular: this.isPopularFilter || undefined,
      status: this.statusFilter || undefined
    };

    const url = `${this.api.meal.list}`;
    this.httpService.list(url, payload, 'mealsList').subscribe({
      next: (res) => {
        if (res?.status && res?.items?.data) {
          this.meals = res.items.data.map((meal: any) => ({
            ...meal,
            name: meal.name,
            price: meal.cost,
            category: meal.category?.title || 'No Category',
            categoryId: meal.category?.id,
            status: meal.status === 1 ? 'Active' : 'Inactive',
            isPopular: meal.is_popular === 1,
            isPickedYou: meal.is_picked_you === 1,
            preparationTime: meal.preparation_time,
            customizationsCount: meal.customizations?.length || 0
          }));
          this.totalCount = res.items.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load meals');
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
    this.categoryFilter = '';
    this.isPopularFilter = '';
    this.statusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  toggleStatus(meal: any): void {
    const newStatus = meal.status === 'Active' ? 0 : 1;
    
    // Prepare form data for the API
    const formData = new FormData();
    formData.append('cost', meal.price.toString());
    formData.append('translations[en][name]', meal.name);
    formData.append('translations[ar][name]', meal.name); // Assuming same for now
    formData.append('preparation_time', meal.preparationTime.toString());
    formData.append('is_popular', meal.isPopular ? '1' : '0');
    formData.append('is_picked_you', meal.isPickedYou ? '1' : '0');
    formData.append('is_active', newStatus.toString());
    formData.append('restaurant_id', this.restaurantId.toString());
    formData.append('category_id', meal.categoryId.toString());

    const url = this.api.meal.edit(meal.id);
    this.httpService.action(url, formData, 'toggleMealStatus').subscribe({
      next: (res: any) => {
        if (res.success || res.status) {
          meal.status = newStatus === 1 ? 'Active' : 'Inactive';
          this.toastr.Showsuccess(`Meal "${meal.name}" status updated to ${meal.status}`);
        } else {
          this.toastr.Showerror(res.msg || res.message || 'Failed to update status');
        }
      },
      error: (error: any) => {
        console.error('Error updating status:', error);
        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Failed to update status';
        this.toastr.Showerror(errorMessage);
      }
    });
  }

  add(): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.restaurantId = this.restaurantId;
    modalRef.componentInstance.categories = this.categoryOptions.filter(c => c.value !== '');
    modalRef.result.then(() => this.list(1));
  }

  edit(meal: any): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.meal = meal;
    modalRef.componentInstance.restaurantId = this.restaurantId;
    modalRef.componentInstance.categories = this.categoryOptions.filter(c => c.value !== '');
    modalRef.result.then(() => this.list(this.page));
  }

  delete(meal: any): void {
    const modalRef = this.modalService.open(DeleteComponent);
    modalRef.componentInstance.id = meal.id;
    modalRef.componentInstance.type = 'meal';
    modalRef.componentInstance.message = `Do you want to delete "${meal.name}"?`;
    modalRef.result.then(() => this.list(this.page));
  }

  openImageModal(image: string): void {
    this.publicService.openImage('Meal Image', image);
  }
}
