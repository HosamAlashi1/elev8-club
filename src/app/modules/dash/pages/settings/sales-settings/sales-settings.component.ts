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
  group_name: string;
  group_link: string;
  group_order: number;
  counter: number;
  whatsapp_number?: string;
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
  readonly maxGroups = 10;
  readonly groupCapacity = 1000;

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
          this.salesItems = items.map((item, index) => ({
            id: item.key,
            group_name: item.group_name || item.name || `WhatsApp Group ${item.group_order || index + 1}`,
            group_link: item.group_link || item.whatsapp_link || this.getLegacyWhatsAppLink(item.whatsapp_number),
            group_order: Number(item.group_order) || index + 1,
            counter: item.counter || 0,
            whatsapp_number: item.whatsapp_number || '',
            versionKey: item.versionKey
          })).sort((a, b) => a.group_order - b.group_order);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading WhatsApp groups:', err);
          this.toastr.showError('Failed to load WhatsApp groups');
          this.isLoading = false;
        }
      });
  }

  add(): void {
    if (!this.currentVersion) {
      this.toastr.showError('No active version found');
      return;
    }

    if (this.salesItems.length >= this.maxGroups) {
      this.toastr.showWarning('You already have 10 WhatsApp groups for this version');
      return;
    }

    const modalRef = this.modalService.open(AddEditSalesItemComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.versionKey = this.currentVersion.key;
    modalRef.componentInstance.nextOrder = this.getNextGroupOrder();

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
      `Are you sure you want to delete ${item.group_name}? This action cannot be undone.`;

    modalRef.result.then(result => {
      if (result === 'deleted') {
        this.toastr.showSuccess('WhatsApp group deleted successfully');
        this.loadSalesItems();
      }
    });
  }

  getUsagePercent(item: SalesItem): number {
    return Math.min(100, Math.round(((item.counter || 0) / this.groupCapacity) * 100));
  }

  getNextGroupOrder(): number {
    const usedOrders = new Set(this.salesItems.map(item => item.group_order));
    for (let order = 1; order <= this.maxGroups; order += 1) {
      if (!usedOrders.has(order)) return order;
    }
    return Math.min(this.salesItems.length + 1, this.maxGroups);
  }

  private getLegacyWhatsAppLink(value?: string): string {
    const phone = (value || '').replace(/[^0-9]/g, '');
    return phone ? `https://wa.me/${phone}` : '';
  }
}
