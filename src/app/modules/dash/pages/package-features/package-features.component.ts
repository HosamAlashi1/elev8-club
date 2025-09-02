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
  selector: 'app-package-features',
  templateUrl: './package-features.component.html',
  styleUrls: ['./package-features.component.css'],
})
export class PackageFeaturesComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  packageFeatures: any[] = [];
  packages: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  selectedPackageId = '';
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
    this.loadPackages();
    this.loadData();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  loadPackages(): void {
    // Load packages for dropdown filter
    const payload = { perPage: 100, page: 1, search: '' };
    const url = `${this.api.packages.list}`;
    this.httpService.list(url, payload, 'packagesList').subscribe({
      next: (res) => {
        if (res?.status && res?.data?.data) {
          this.packages = res.data.data;
        }
      },
      error: () => {
        console.error('Failed to load packages');
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
      package_id: this.selectedPackageId || undefined
    };

    const url = `${this.api.packageFeatures.list}`;
    this.httpService.list(url, payload, 'packageFeaturesList').subscribe({
      next: (res) => {
        if (res?.status && res?.data?.data) {
          this.packageFeatures = res.data.data.map((pf: any) => ({
            ...pf,
            image: pf.image || 'assets/img/blank.png'
          }));
          this.totalCount = res.data.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.showError('Failed to load package features');
        this.isLoading$.next(false);
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onPackageChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  reset(): void {
    this.searchText = '';
    this.selectedPackageId = '';
    this.page = 1;
    this.list(this.page);
  }

  add() {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.packages = this.packages;
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.packageFeature = item;
    modalRef.componentInstance.packages = this.packages;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'package-feature';
    modalRef.componentInstance.message = `Do you want to delete ${item.title} ?`;
    modalRef.result.then(() => this.list(1));
  }

  openImageModal(image: string) {
    this.publicService.openImage('Package Feature Image', image);
  }
}
