import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../../../services/public.service';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddEditFileComponent } from './add-edit/add-edit.component';
import { PreviewModalComponent } from './preview/preview.component';

type AssetType = 'image' | 'pdf' | 'audio' | 'video';
type DateRange = '7d' | '30d' | 'year';

interface AssetItem {
  id: number;
  title: string;
  type: AssetType;
  sizeMB: number;
  date: string;        // ISO string
  thumbnail: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {

  // loading & data
  isLoading$ = new BehaviorSubject<boolean>(true);
  files: AssetItem[] = [];
  view: 'grid' | 'list' = 'grid';
  totalCount = 0;
  
  // متغير للتحكم في الأنيميشن عند التبديل بين Grid/List فقط
  showViewAnimation = false;

  // paging & search
  page = 1;
  gridSize = 4;  // حجم خاص بالـ Grid View
  listSize = 10; // حجم خاص بالـ List View (مثل الجدول)
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  // دالة للحصول على الحجم الحالي حسب الـ View
  get currentSize(): number {
    return this.view === 'grid' ? this.gridSize : this.listSize;
  }

  // filters
  fileTypeFilter: '' | AssetType = '';
  dateRangeFilter: '' | DateRange = '';

  fileTypeOptions = [
    { value: '', label: 'File Type' },
    { value: 'image', label: 'Image' },
    { value: 'pdf', label: 'PDF' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' }
  ];

  dateRangeOptions = [
    { value: '', label: 'Date Range' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'year', label: 'This year' }
  ];

  // displayed page
  pageFiles: AssetItem[] = [];

  // ===== MOCK DATA (based on your assets) =====
  private readonly MOCK_FILES: AssetItem[] = [
    {
      id: 1,
      title: 'Book Cover - The Great...',
      type: 'image',
      sizeMB: 2.4,
      date: '2024-01-15',
      thumbnail: 'assets/img/dashboard/catalog/assets/image1.png'
    },
    {
      id: 2,
      title: 'Book Preview - Mystery...',
      type: 'pdf',
      sizeMB: 8.7,
      date: '2024-01-14',
      thumbnail: 'assets/img/dashboard/catalog/assets/image2.png'
    },
    {
      id: 3,
      title: 'Audio Book - Classic Tales',
      type: 'audio',
      sizeMB: 15.2,
      date: '2024-01-13',
      thumbnail: 'assets/img/dashboard/catalog/assets/image3.png'
    },
    {
      id: 4,
      title: 'Marketing Banner - Summer Sale',
      type: 'image',
      sizeMB: 1.8,
      date: '2024-01-12',
      thumbnail: 'assets/img/dashboard/catalog/assets/image4.png'
    },
    {
      id: 1,
      title: 'Book Cover - The Great...',
      type: 'image',
      sizeMB: 2.4,
      date: '2024-01-15',
      thumbnail: 'assets/img/dashboard/catalog/assets/image1.png'
    },
    {
      id: 2,
      title: 'Book Preview - Mystery...',
      type: 'pdf',
      sizeMB: 8.7,
      date: '2024-01-14',
      thumbnail: 'assets/img/dashboard/catalog/assets/image2.png'
    },
    {
      id: 3,
      title: 'Audio Book - Classic Tales',
      type: 'audio',
      sizeMB: 15.2,
      date: '2024-01-13',
      thumbnail: 'assets/img/dashboard/catalog/assets/image3.png'
    },
    {
      id: 4,
      title: 'Marketing Banner - Summer Sale',
      type: 'image',
      sizeMB: 1.8,
      date: '2024-01-12',
      thumbnail: 'assets/img/dashboard/catalog/assets/image4.png'
    },
    {
      id: 1,
      title: 'Book Cover - The Great...',
      type: 'image',
      sizeMB: 2.4,
      date: '2024-01-15',
      thumbnail: 'assets/img/dashboard/catalog/assets/image1.png'
    },
    {
      id: 2,
      title: 'Book Preview - Mystery...',
      type: 'pdf',
      sizeMB: 8.7,
      date: '2024-01-14',
      thumbnail: 'assets/img/dashboard/catalog/assets/image2.png'
    },
    {
      id: 3,
      title: 'Audio Book - Classic Tales',
      type: 'audio',
      sizeMB: 15.2,
      date: '2024-01-13',
      thumbnail: 'assets/img/dashboard/catalog/assets/image3.png'
    },
    {
      id: 4,
      title: 'Marketing Banner - Summer Sale',
      type: 'image',
      sizeMB: 1.8,
      date: '2024-01-12',
      thumbnail: 'assets/img/dashboard/catalog/assets/image4.png'
    },
  ];

  constructor(private publicService: PublicService , private modalService: NgbModal) {
    // حساب حجم Grid (نفس الحالي)
    this.gridSize = 4;
    
    // حساب حجم List مثل جدول الكتب
    this.listSize = this.publicService.getNumOfRows(505, 93);
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

    setTimeout(() => {
      const term = this.searchText.trim().toLowerCase();

      let data = [...this.MOCK_FILES];

      // filter by type
      if (this.fileTypeFilter) {
        data = data.filter(f => f.type === this.fileTypeFilter);
      }

      // filter by date range
      if (this.dateRangeFilter) {
        const now = new Date();
        data = data.filter(f => this.inRange(new Date(f.date), now, this.dateRangeFilter || undefined));
      }

      // search
      if (term) {
        data = data.filter(f => f.title.toLowerCase().includes(term));
      }

      this.totalCount = data.length;

      // pagination
      const start = (this.page - 1) * this.currentSize;
      const end = start + this.currentSize;
      this.files = data;
      this.pageFiles = data.slice(start, end);

      this.isLoading$.next(false);
    }, 500);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onTypeChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  onDateChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  toggleView(mode: 'grid' | 'list') {
    if (this.view !== mode) {  // فقط عند تغيير الـ view
      this.view = mode;
      this.showViewAnimation = true;  // تفعيل الأنيميشن
      this.page = 1;
      this.list(1);
      
      // إيقاف الأنيميشن بعد انتهائه
      setTimeout(() => {
        this.showViewAnimation = false;
      }, 350); // نفس مدة الأنيميشن
    }
  }

  // helper: date range
  private inRange(d: Date, now: Date, range?: DateRange): boolean {
    if (!range) return true; // لا يوجد فلتر => اعتبره ضمن النطاق
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (range === '7d') return diffDays <= 7;
    if (range === '30d') return diffDays <= 30;
    // 'year'
    return d.getFullYear() === now.getFullYear();
  }

  // icons for meta row
  getTypeIcon(t: AssetType): string {
    switch (t) {
      case 'image': return 'fe fe-image';
      case 'pdf': return 'fe fe-file-text';
      case 'audio': return 'fe fe-mic';
      case 'video': return 'fe fe-video';
    }
  }

  // Upload (mock)
  onUploadClick(input: HTMLInputElement) {
    input.click();
  }

  onUploadChange(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;

    const type: AssetType =
      file.type.startsWith('image') ? 'image' :
      file.type.includes('pdf') ? 'pdf' :
      file.type.startsWith('audio') ? 'audio' :
      file.type.startsWith('video') ? 'video' : 'image';

    const obj: AssetItem = {
      id: Date.now(),
      title: file.name,
      type,
      sizeMB: +(file.size / (1024 * 1024)).toFixed(1),
      date: new Date().toISOString(),
      thumbnail: URL.createObjectURL(file)
    };
    this.MOCK_FILES.unshift(obj);
    this.list(1);
  }

  openImageModal(image: string) {
    this.publicService.openImage('File Preview', image);
  }

    add() {
      const modalRef = this.modalService.open(AddEditFileComponent, { size: 'md', centered: true });
      modalRef.result.then(() => this.list(1));
    }
  
    edit(item: any) {
      const modalRef = this.modalService.open(AddEditFileComponent, { size: 'md', centered: true });
      modalRef.componentInstance.file = item;
      modalRef.result.then(() => this.list(1));
    }
  
    delete(item: any) {
      const modalRef = this.modalService.open(DeleteComponent, {});
      modalRef.componentInstance.id = item.id;
      modalRef.componentInstance.type = 'file';
      modalRef.componentInstance.message = `Do you want to delete ${item.name} file ?`;
      modalRef.result.then(() => this.list(1));
    }

    preview(item: any) {
      const modalRef = this.modalService.open(PreviewModalComponent, { size: 'lg', centered: true });
      modalRef.componentInstance.file = item;
      modalRef.result.then(() => this.list(1));
    }
}
