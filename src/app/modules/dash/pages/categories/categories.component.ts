import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../services/toater.service';
import { PublicService } from '../../services/public.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../shared/delete/delete.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class CategoriesComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  categories: any[] = [];
  allCategories: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  constructor(
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal
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
    // Dummy categories data
    this.allCategories = [
      { id: 1, name: 'Pizza', image: 'assets/img/blank.png' },
      { id: 2, name: 'Burgers', image: 'assets/img/blank.png' },
      { id: 3, name: 'Desserts', image: 'assets/img/blank.png' },
      { id: 4, name: 'Pasta', image: 'assets/img/blank.png' },
      { id: 5, name: 'Sushi', image: 'assets/img/blank.png' },
      { id: 6, name: 'Salads', image: 'assets/img/blank.png' },
      { id: 7, name: 'Sandwiches', image: 'assets/img/blank.png' },
      { id: 8, name: 'Steak', image: 'assets/img/blank.png' },
      { id: 9, name: 'Breakfast', image: 'assets/img/blank.png' },
      { id: 10, name: 'Soups', image: 'assets/img/blank.png' },
      { id: 11, name: 'Ice Cream', image: 'assets/img/blank.png' },
      { id: 12, name: 'Grilled', image: 'assets/img/blank.png' },
      { id: 13, name: 'Vegan', image: 'assets/img/blank.png' },
      { id: 14, name: 'Seafood', image: 'assets/img/blank.png' },
      { id: 15, name: 'Tacos', image: 'assets/img/blank.png' },
      { id: 16, name: 'Waffles', image: 'assets/img/blank.png' },
      { id: 17, name: 'Kebabs', image: 'assets/img/blank.png' },
      { id: 18, name: 'Shawarma', image: 'assets/img/blank.png' },
      { id: 19, name: 'Juices', image: 'assets/img/blank.png' },
      { id: 20, name: 'Fried Chicken', image: 'assets/img/blank.png' }
    ];
    this.list(this.page);
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    // Simulate delay for loader (optional for realism)
    setTimeout(() => {
      const filtered = this.allCategories.filter(c =>
        c.name.toLowerCase().includes(this.searchText.trim().toLowerCase())
      );

      this.totalCount = filtered.length;
      this.categories = filtered.slice((page - 1) * this.size, page * this.size);

      this.isLoading$.next(false);
    }, 600); // <-- simulates API loading (optional)
  }


  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.list(this.page);
  }

  add(): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then((newCategory: any) => {
      if (newCategory) {
        this.allCategories.unshift(newCategory);
        this.list(1);
      }
    }).catch(() => { });
  }

  edit(item: any): void {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.category = item;

    modalRef.result.then((updatedCategory: any) => {
      if (updatedCategory) {
        const index = this.allCategories.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
          this.allCategories[index] = updatedCategory;
          this.list(this.page);
        }
      }
    }).catch(() => { });
  }

  delete(item: any): void {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'category';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} ?`;
    modalRef.result.then(() => {
      this.allCategories = this.allCategories.filter(c => c.id !== item.id);
      this.list(this.page);
      this.toastr.Showsuccess(`${item.name} deleted successfully`);
    }).catch(() => { });
  }

  openImageModal(image: string): void {
    this.publicService.openImage('Category Image', image);
  }
}
