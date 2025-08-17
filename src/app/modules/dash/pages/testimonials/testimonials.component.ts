import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css'],
})
export class TestimonialsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  testimonials: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

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
      search: this.searchText.trim()
    };

    const url = `${this.api.testimonials.list}`;
    this.httpService.list(url, payload, 'testimonialsList').subscribe({
      next: (res) => {
        if (res?.status && res?.data?.data) {
          this.testimonials = res.data.data.map((testimonial: any) => ({
            ...testimonial,
            image: testimonial.image || 'assets/img/blank.png'
          }));
          this.totalCount = res.data.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load testimonials');
        this.isLoading$.next(false);
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.list(this.page);
  }

  add() {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'xl', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'xl', centered: true });
    modalRef.componentInstance.testimonial = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'testimonial';
    modalRef.componentInstance.message = `Do you want to delete ${item.name_en} testimonial ?`;
    modalRef.result.then(() => this.list(1));
  }

  openImageModal(image: string) {
    this.publicService.openImage('Testimonial Image', image);
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((x, i) => i < rating ? 1 : 0);
  }
  
}
