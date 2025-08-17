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
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css'],
})
export class AdminsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  users: any[] = [];

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

    const url = `${this.api.admin.list}`;
    this.httpService.list(url, payload, 'usersList').subscribe({
      next: (res) => {
        if (res?.status && res?.data?.data) {
          this.users = res.data.data.map((u: any) => ({
            ...u,
            image: u.image || 'assets/img/blank.png'
          }));
          this.totalCount = res.data.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load admins');
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
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.user = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'admin';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} ?`;
    modalRef.result.then(() => this.list(1));
  }

  openImageModal(image: string) {
    this.publicService.openImage('Admin Image', image);
  }
}
