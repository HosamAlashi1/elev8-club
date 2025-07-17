import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-meals',
  templateUrl: './meals.component.html',
  styleUrls: ['./meals.component.css'],
})
export class MealsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  meals: any[] = [];
  allMeals: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  restaurantName = '';
  restaurantId!: number;

  constructor(
    private modalService: NgbModal,
    private publicService: PublicService,
    private toastr: ToastrsService,
    private route: ActivatedRoute,
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
  }

  ngOnInit(): void {
    this.restaurantId = +this.route.snapshot.paramMap.get('restaurantId')!;
    this.restaurantName = history.state.restaurantName || 'Unknown Restaurant';
    this.loadData();
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  loadData(): void {
    this.allMeals = [
      // 🍔 Restaurant 1: Fast Foodies
      { id: 1, restaurant_id: 31, name: 'Cheeseburger', price: 25, category: 'Burgers', status: 'Active', image: 'assets/img/blank.png' },
      { id: 2, restaurant_id: 31, name: 'Shawarma Wrap', price: 18, category: 'Wraps', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 3, restaurant_id: 31, name: 'Zinger Sandwich', price: 23, category: 'Sandwiches', status: 'Active', image: 'assets/img/blank.png' },
      { id: 4, restaurant_id: 31, name: 'French Fries', price: 9, category: 'Sides', status: 'Active', image: 'assets/img/blank.png' },
      { id: 5, restaurant_id: 31, name: 'Hot Dog', price: 15, category: 'Sandwiches', status: 'Active', image: 'assets/img/blank.png' },
      { id: 6, restaurant_id: 31, name: 'Grilled Chicken Burger', price: 27, category: 'Burgers', status: 'Active', image: 'assets/img/blank.png' },
      { id: 7, restaurant_id: 31, name: 'Onion Rings', price: 11, category: 'Sides', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 8, restaurant_id: 31, name: 'Crispy Chicken Wrap', price: 20, category: 'Wraps', status: 'Active', image: 'assets/img/blank.png' },
      { id: 9, restaurant_id: 31, name: 'Beef Nuggets', price: 17, category: 'Sides', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 10, restaurant_id: 31, name: 'Spicy Wings', price: 22, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 11, restaurant_id: 31, name: 'Steak Sandwich', price: 30, category: 'Sandwiches', status: 'Active', image: 'assets/img/blank.png' },
      { id: 12, restaurant_id: 31, name: 'BBQ Burger', price: 26, category: 'Burgers', status: 'Inactive', image: 'assets/img/blank.png' },

      // 🍕 Restaurant 2: Italiano Pizza
      { id: 13, restaurant_id: 30, name: 'Margherita Pizza', price: 28, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 14, restaurant_id: 30, name: 'Pepperoni Pizza', price: 32, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 15, restaurant_id: 30, name: 'Four Cheese Pizza', price: 35, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 16, restaurant_id: 30, name: 'Vegetarian Pizza', price: 30, category: 'Pizza', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 17, restaurant_id: 30, name: 'Pizza Calzone', price: 33, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 18, restaurant_id: 30, name: 'Seafood Pizza', price: 36, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 19, restaurant_id: 30, name: 'Pizza Alfredo', price: 34, category: 'Pizza', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 20, restaurant_id: 30, name: 'Pizza Chicken Ranch', price: 31, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 21, restaurant_id: 30, name: 'Pizza Supreme', price: 37, category: 'Pizza', status: 'Active', image: 'assets/img/blank.png' },
      { id: 22, restaurant_id: 30, name: 'Cheesy Garlic Bread', price: 14, category: 'Sides', status: 'Active', image: 'assets/img/blank.png' },
      { id: 23, restaurant_id: 30, name: 'Spaghetti Bolognese', price: 29, category: 'Pasta', status: 'Active', image: 'assets/img/blank.png' },
      { id: 24, restaurant_id: 30, name: 'Lasagna', price: 30, category: 'Pasta', status: 'Inactive', image: 'assets/img/blank.png' },

      // 🐔 Restaurant 3: Chicken House
      { id: 25, restaurant_id: 29, name: 'Grilled Chicken', price: 33, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 26, restaurant_id: 29, name: 'Chicken Nuggets', price: 16, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 27, restaurant_id: 29, name: 'Fried Chicken Bucket', price: 40, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 28, restaurant_id: 29, name: 'BBQ Chicken Wings', price: 25, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 29, restaurant_id: 29, name: 'Spicy Chicken Fillet', price: 24, category: 'Chicken', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 30, restaurant_id: 29, name: 'Zinger Twister', price: 22, category: 'Wraps', status: 'Active', image: 'assets/img/blank.png' },
      { id: 31, restaurant_id: 29, name: 'Chicken Caesar Salad', price: 21, category: 'Salads', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 32, restaurant_id: 29, name: 'Chicken & Rice Box', price: 19, category: 'Meals', status: 'Active', image: 'assets/img/blank.png' },
      { id: 33, restaurant_id: 29, name: 'Hot Chicken Wings', price: 27, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 34, restaurant_id: 29, name: 'Mini Chicken Wraps', price: 18, category: 'Wraps', status: 'Inactive', image: 'assets/img/blank.png' },
      { id: 35, restaurant_id: 29, name: 'Honey Glazed Chicken', price: 29, category: 'Chicken', status: 'Active', image: 'assets/img/blank.png' },
      { id: 36, restaurant_id: 29, name: 'Crunchy Chicken Sandwich', price: 23, category: 'Sandwiches', status: 'Active', image: 'assets/img/blank.png' },
    ];
    this.list(this.page);
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    setTimeout(() => {
      const filtered = this.allMeals
        .filter(meal =>
          meal.restaurant_id === this.restaurantId &&
          meal.name.toLowerCase().includes(this.searchText.trim().toLowerCase())
        );

      this.totalCount = filtered.length;
      this.meals = filtered.slice((page - 1) * this.size, page * this.size);
      this.isLoading$.next(false);
    }, 500);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.list(this.page);
  }

  toggleStatus(meal: any): void {
    meal.status = meal.status === 'Active' ? 'Inactive' : 'Active';
    this.toastr.Showsuccess(`Meal "${meal.name}" is now ${meal.status}`);
  }

  add(): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then((result) => {
      if (result) {
        this.allMeals.push(result);
        this.list(1);
      }
    }).catch(() => { });
  }

  edit(meal: any): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.meal = meal;
    modalRef.result.then((result) => {
      if (result) {
        const index = this.allMeals.findIndex(m => m.id === result.id);
        if (index !== -1) {
          this.allMeals[index] = result;
          this.list(this.page);
        }
      }
    }).catch(() => { });
  }

  delete(meal: any): void {
    const modalRef = this.modalService.open(DeleteComponent);
    modalRef.componentInstance.id = meal.id;
    modalRef.componentInstance.type = 'meal';
    modalRef.componentInstance.message = `Do you want to delete "${meal.name}"?`;
    modalRef.result.then(() => {
      this.allMeals = this.allMeals.filter(m => m.id !== meal.id);
      this.list(this.page);
    }).catch(() => { });
  }

  openImageModal(image: string): void {
    this.publicService.openImage('Meal Image', image);
  }
}
