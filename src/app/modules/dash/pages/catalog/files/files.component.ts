import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PublicService } from '../../../../services/public.service';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { ToastrsService } from '../../../../services/toater.service';
import { AddEditFileComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { PreviewModalComponent } from './preview/preview.component';

type FileType = 0 | 1 | 2 | 3; // Backend enum mapping
type ViewMode = 'grid' | 'list';

interface FileItem {
  id: number;
  file_name: string;
  file_type: string;
  file_size: string;
  file_url: string;
  insert_date: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {

  // loading & data
  isLoading$ = new BehaviorSubject<boolean>(true);
  files: FileItem[] = [];
  totalCount = 0;

  // view mode
  view: ViewMode = 'grid';
  showViewAnimation = false;

  // paging & search
  page = 1;
  gridSize = 4;
  listSize = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  // filters
  fileTypeFilter: FileType = 0; // all by default
  fileTypeOptions = [
    { value: 0, label: 'All Files' },
    { value: 1, label: 'Images' },
    { value: 2, label: 'Documents (PDF, Word...)' },
    { value: 3, label: 'Audio' }
  ];

  constructor(
    public publicService: PublicService,
    private modalService: NgbModal,
    private http: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) {
    this.listSize = this.publicService.getNumOfRows(505, 93);
  }

  ngOnInit(): void {
    this.list(this.page);

    // search debounce
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  get currentSize(): number {
    return this.view === 'grid' ? this.gridSize : this.listSize;
  }

  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    const type = this.fileTypeFilter ?? 0;
    return `${this.api.files.list}?q=${q}&type=${type}&size=${this.currentSize}&page=${this.page}`;
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    const url = this.buildUrl();

    this.http.listGet(url, 'files-list').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          this.totalCount = res.data.total_records ?? 0;
          this.files = res.data.data || [];
        } else {
          this.totalCount = 0;
          this.files = [];
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.totalCount = 0;
        this.files = [];
        this.isLoading$.next(false);
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onTypeChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  toggleView(mode: ViewMode): void {
    if (this.view !== mode) {
      this.view = mode;
      this.showViewAnimation = true;
      this.page = 1;
      this.list(this.page);

      setTimeout(() => {
        this.showViewAnimation = false;
      }, 350);
    }
  }

  // 🔹 Helpers
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image')) return 'fe fe-image';
    if (fileType.includes('pdf')) return 'fe fe-file-text';
    if (fileType.includes('word')) return 'fe fe-file';
    if (fileType.startsWith('audio')) return 'fe fe-mic';
    return 'fe fe-file text-muted';
  }

  openPreview(file: FileItem): void {
    const modalRef = this.modalService.open(PreviewModalComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.file = file;

    modalRef.result.then((refresh) => {
      if (refresh) this.list(1);
    });
  }

  add(): void {
    const modalRef = this.modalService.open(AddEditFileComponent, { size: 'md', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(file: any): void {
    const modalRef = this.modalService.open(AddEditFileComponent, { size: 'md', centered: true });
    modalRef.componentInstance.file = file;
    modalRef.result.then(() => this.list(1));
  }

  delete(file: FileItem): void {
    const modalRef = this.modalService.open(DeleteComponent);
    modalRef.componentInstance.id = file.id;
    modalRef.componentInstance.type = 'file';
    modalRef.componentInstance.message = `Do you want to delete "${file.file_name}" file?`;

    modalRef.result.then((res) => {
      if (res === 'deleted') this.list(1);
    });
  }

  download(file: any): void {
    const fileName = file.file_name || 'downloaded_file';
    const fileUrl = this.api.files.download(file.id);

    fetch(fileUrl, { method: 'GET' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to download file.');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.open(fileUrl, '_blank');
      });
  }
  preview(file: FileItem): void {
    this.openPreview(file);
  }

  // 🔹 Friendly file type name
  getFriendlyType(fileType: string): string {
    if (!fileType) return 'Unknown';
    if (fileType.startsWith('image')) return 'Image';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Document';
    if (fileType.startsWith('audio')) return 'Audio';
    if (fileType.startsWith('video')) return 'Video';
    return 'Other';
  }


}
