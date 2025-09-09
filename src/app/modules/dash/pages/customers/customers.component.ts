import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../services/public.service';

type CustomerStatus = 'active' | 'inactive';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;   // USD
  lastOrder: string;    // YYYY-MM-DD
  category: string;
  status: CustomerStatus;
  avatar: string;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {

  // loading & data
  isLoading$ = new BehaviorSubject<boolean>(true);
  customers: Customer[] = [];
  totalCount = 0;

  // paging & search
  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  // filters
  statusFilter: '' | CustomerStatus = '';

  // selection (Bulk actions)
  selectedIds = new Set<number>();
  selectAll = false;

  // ===== Avatars you provided (rotated automatically) =====
  private readonly AVATARS = [
    'assets/img/dashboard/customers/person1.png',
    'assets/img/dashboard/customers/person2.png',
    'assets/img/dashboard/customers/person3.png'
  ];

  // ===== RAW DATA extracted from the screenshot (without avatars) =====
  private readonly RAW_ROWS = [
    {
      id: 201,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '(555) 123-4567',
      totalOrders: 24,
      totalSpend: 1249.99,
      lastOrder: '2024-01-15',
      category: 'Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 202,
      name: 'Michael Chen',
      email: 'm.chen@example.com',
      phone: '(555) 234-5678',
      totalOrders: 18,
      totalSpend: 899.50,
      lastOrder: '2024-01-10',
      category: 'Non-Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 203,
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      phone: '(555) 345-6789',
      totalOrders: 12,
      totalSpend: 549.99,
      lastOrder: '2024-01-05',
      category: "Children's",
      status: 'inactive' as CustomerStatus
    },
    {
      id: 204,
      name: 'David Brown',
      email: 'david.b@example.com',
      phone: '(555) 456-7890',
      totalOrders: 31,
      totalSpend: 1599.99,
      lastOrder: '2024-01-18',
      category: 'Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 201,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '(555) 123-4567',
      totalOrders: 24,
      totalSpend: 1249.99,
      lastOrder: '2024-01-15',
      category: 'Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 202,
      name: 'Michael Chen',
      email: 'm.chen@example.com',
      phone: '(555) 234-5678',
      totalOrders: 18,
      totalSpend: 899.50,
      lastOrder: '2024-01-10',
      category: 'Non-Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 203,
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      phone: '(555) 345-6789',
      totalOrders: 12,
      totalSpend: 549.99,
      lastOrder: '2024-01-05',
      category: "Children's",
      status: 'inactive' as CustomerStatus
    },
    {
      id: 204,
      name: 'David Brown',
      email: 'david.b@example.com',
      phone: '(555) 456-7890',
      totalOrders: 31,
      totalSpend: 1599.99,
      lastOrder: '2024-01-18',
      category: 'Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 201,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '(555) 123-4567',
      totalOrders: 24,
      totalSpend: 1249.99,
      lastOrder: '2024-01-15',
      category: 'Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 202,
      name: 'Michael Chen',
      email: 'm.chen@example.com',
      phone: '(555) 234-5678',
      totalOrders: 18,
      totalSpend: 899.50,
      lastOrder: '2024-01-10',
      category: 'Non-Fiction',
      status: 'active' as CustomerStatus
    },
    {
      id: 203,
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      phone: '(555) 345-6789',
      totalOrders: 12,
      totalSpend: 549.99,
      lastOrder: '2024-01-05',
      category: "Children's",
      status: 'inactive' as CustomerStatus
    },
    {
      id: 204,
      name: 'David Brown',
      email: 'david.b@example.com',
      phone: '(555) 456-7890',
      totalOrders: 31,
      totalSpend: 1599.99,
      lastOrder: '2024-01-18',
      category: 'Fiction',
      status: 'active' as CustomerStatus
    }
  ];

  constructor(private publicService: PublicService) {
    // نفس منطقك لحساب الصفوف المعروضة
    this.size = this.publicService.getNumOfRows(450, 77);
  }

  ngOnInit(): void {
    this.loadData();

    // ديباونس للبحث
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
    this.selectedIds.clear();
    this.selectAll = false;

    // محاكاة API: فلترة + بحث + تقسيم صفحات + تأخير بسيط لعرض اللودر/السكلتون
    setTimeout(() => {
      const term = this.searchText.trim().toLowerCase();

      // أضف الصور بتدوير تلقائي
      let data: Customer[] = this.RAW_ROWS.map((r, i) => ({
        ...r,
        avatar: this.AVATARS[i % this.AVATARS.length]
      }));

      if (this.statusFilter) {
        data = data.filter(c => c.status === this.statusFilter);
      }

      if (term) {
        data = data.filter(c =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term) ||
          c.status.toLowerCase().includes(term)
        );
      }

      this.totalCount = data.length;

      const start = (this.page - 1) * this.size;
      const end = start + this.size;
      this.customers = data.slice(start, end);

      this.isLoading$.next(false);
    }, 600);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  reset(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  // ===== UI helpers =====
  getStatusPillClass(status: CustomerStatus): string {
    return status === 'active' ? 'pill-success' : 'pill-secondary';
  }

  // selection
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedIds.clear();
    if (this.selectAll) this.customers.forEach(c => this.selectedIds.add(c.id));
  }

  toggleRow(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.selectAll = this.selectedIds.size === this.customers.length && this.customers.length > 0;
  }

  // bulk action example (placeholder)
  bulkArchive(): void {
    alert(`Bulk action on: [${[...this.selectedIds].join(', ')}]`);
  }

  openImageModal(image: string) {
    this.publicService.openImage('Customer', image);
  }
}
