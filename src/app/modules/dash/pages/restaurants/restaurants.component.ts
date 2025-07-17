import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PublicService } from '../../services/public.service';
import { ToastrsService } from '../../services/toater.service';
import { RestaurantService } from '../../services/restaurant.service';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewMapComponent } from './view-map/view-map.component';
import { ApiService } from '../../services/api.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-restaurants',
  templateUrl: './restaurants.component.html',
  styleUrls: ['./restaurants.component.css'],
})
export class RestaurantsComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(true);
  restaurants: any[] = [];
  allRestaurants: any[] = [];

  columns = [
    { label: 'Name', key: 'name', width: 'w-25' },
    { label: 'Location', key: 'location', width: 'w-30' },
    { label: 'Status', key: 'status', width: 'w-25', isStatus: true }
  ];

  statusFilter: string = '';
  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  // Options for status filter
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' }
  ];

  constructor(
    private router: Router,
    private publicService: PublicService,
    private toastr: ToastrsService,
    public restaurantService: RestaurantService,
    private modalService: NgbModal,
    private api: ApiService,
    private http: HttpService
  ) {
    this.size = this.publicService.getNumOfRows(315, 73.24);
  }

  ngOnInit(): void {
    this.loadData();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  loadData() {
    this.isLoading$.next(true);

    const requestBody = {
      page: this.page,
      perPage: this.size,
      search: this.searchText,
      status: this.statusFilter || undefined
    };

    this.http.list(this.api.restaurants.list, requestBody, 'restaurants').subscribe({
      next: (res: any) => {
        const data = res?.items?.data || [];
        this.restaurants = data;
        this.totalCount = res?.items?.total_records || 0;
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load restaurants');
        this.isLoading$.next(false);
      }
    });
  }

  list(page: number) {
    this.page = page;
    this.loadData();
  }


  toggleStatus(restaurant: any): void {
    restaurant.status = restaurant.status === true ? false : true;
    this.toastr.Showsuccess(
      `Restaurant "${restaurant.name}" is now marked as ${restaurant.status ? 'ACTIVE' : 'INACTIVE'}`
    );
  }

  add(): void {
    this.router.navigate(['/restaurants/add']);
  }

  edit(item: any): void {
    this.router.navigate(['/restaurants/edit', item.id]);
  }

  openMeals(item: any): void {
    this.router.navigate(['/restaurants', item.id, 'meals'], {
      state: { restaurantName: item.name }
    });
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'restaurant';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} ?`;
    modalRef.result.then(() => this.list(1));
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

  openImageModal(image: string) {
    this.publicService.openImage('Restaurant Image', image);
  }

  viewOnMap(item: any) {
    const modalRef = this.modalService.open(ViewMapComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.location = {
      lat: +item.latitude,
      lng: +item.longitude,
      firstAddress: item.address,
      secondAddress: item.address2,
    };
  }

  onFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

}
