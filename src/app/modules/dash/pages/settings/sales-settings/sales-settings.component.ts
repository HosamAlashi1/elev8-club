import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastrsService } from '../../../../services/toater.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddEditSalesItemComponent } from './add-edit-sales-item/add-edit-sales-item.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { Version } from '../../../../../core/models';

interface SalesItem {
  id?: string;
  whatsapp_number: string;
  counter: number;
  versionKey?: string;
}

@Component({
  selector: 'app-sales-settings',
  templateUrl: './sales-settings.component.html',
  styleUrls: ['./sales-settings.component.css']
})
export class SalesSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  salesItems: SalesItem[] = [];
  isLoading = true;
  currentVersion: Version | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private toastr: ToastrsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadCurrentVersion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentVersion(): void {
    this.isLoading = true;
    this.firebaseService.getCurrentVersion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: version => {
          this.currentVersion = version;
          if (!version) {
            this.toastr.showError('No active version found');
            this.isLoading = false;
            return;
          }

          this.loadSalesItems();
        },
        error: err => {
          console.error('Error loading current version:', err);
          this.toastr.showError('Failed to load current version');
          this.isLoading = false;
        }
      });
  }

  loadSalesItems(): void {
    if (!this.currentVersion) return;

    this.isLoading = true;
    this.firebaseService.getSalesByVersion(this.currentVersion.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: any[]) => {
          this.salesItems = items.map(item => ({
            id: item.key,
            whatsapp_number: item.whatsapp_number || '',
            counter: item.counter || 0,
            versionKey: item.versionKey
          }));
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading sales items:', err);
          this.toastr.showError('Failed to load sales items');
          this.isLoading = false;
        }
      });
  }

  add(): void {
    if (!this.currentVersion) {
      this.toastr.showError('No active version found');
      return;
    }

    const modalRef = this.modalService.open(AddEditSalesItemComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.versionKey = this.currentVersion.key;

    modalRef.result.then(() => this.loadSalesItems(), () => {});
  }

  edit(item: SalesItem): void {
    if (!this.currentVersion) {
      this.toastr.showError('No active version found');
      return;
    }

    const modalRef = this.modalService.open(AddEditSalesItemComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.salesItem = item;
    modalRef.componentInstance.versionKey = this.currentVersion.key;

    modalRef.result.then(() => this.loadSalesItems(), () => {});
  }

  delete(item: SalesItem): void {
    const modalRef = this.modalService.open(DeleteComponent, {});

    modalRef.componentInstance.type = 'sales';
    modalRef.componentInstance.firebaseKey = item.id;
    modalRef.componentInstance.message =
      `Are you sure you want to delete this sales item (${item.whatsapp_number})? This action cannot be undone.`;

    modalRef.result.then(result => {
      if (result === 'deleted') {
        this.toastr.showSuccess('Sales item deleted successfully');
        this.loadSalesItems();
      }
    });
  }
}
