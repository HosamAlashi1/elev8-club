import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../services/toater.service';
import { PublicService } from '../../../services/public.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';


@Component({
  selector: 'app-roles-and-permissions',
  templateUrl: './roles-and-permissions.component.html',
  styleUrls: ['./roles-and-permissions.component.css']
})
export class RolesAndPermissionsComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(true);
  allRoles: any[] = [];
  roles: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  constructor(
      private modalService: NgbModal,
      private toastr: ToastrsService,
      private publicService: PublicService,
      private http: HttpService,
      private api: ApiService
  ) {
    this.size = this.publicService.getNumOfRows(420, 63.74);
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
      q: this.searchText.trim()
    };

    this.http.list(this.api.roles.list, payload, 'roles').subscribe({
      next: (res: any) => {
        this.roles = res?.items?.data || [];
        this.totalCount = res?.items?.total_records || 0;
      },
      error: () => {
        this.roles = [];
        this.totalCount = 0;
      },
      complete: () => {
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
    modalRef.componentInstance.role = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'role';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} ?`;
    modalRef.result.then((res) => {
      if (res === 'deleted') this.list(1);
    });
  }
}
