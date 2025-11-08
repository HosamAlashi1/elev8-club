import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ApiAdminService } from '../../../../../services/api.admin.service';
import { ToastrsService } from '../../../../../services/toater.service';
import { BehaviorSubject } from 'rxjs';

type BookOption = {
  id: number;
  title: string;
  name: string;
  author?: string;
  isbn?: string;
};

@Component({
  selector: 'app-add-edit-file',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditFileComponent implements OnInit {

  @Input() file?: any;
  @Input() preselectBookId?: number | null;

  form!: FormGroup;
  submitted = false;
  isEdit = false;

  // UI
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isImage = false;
  isDragOver = false;
  audioPreview: string | null = null;
  hasExistingFile = false; // للتحقق من وجود ملف في وضع التعديل


  // Books
  booksOptions: BookOption[] = [];
  isLoadingBooks$ = new BehaviorSubject<boolean>(false);
  initialBooksLoaded = false;

  acceptString = '*/*';
  readonly MAX_SIZE_MB = 20;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) { }

  ngOnInit(): void {
    this.isEdit = !!this.file?.id;

    this.form = new FormGroup({
      file: new FormControl(null, this.isEdit ? [] : [Validators.required]),
      file_name: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      file_type: new FormControl('', [Validators.required]),
      book_id: new FormControl(this.preselectBookId ?? null)
    });

    if (this.isEdit) this.patchForm(this.file);
  }

  get f() { return this.form.controls; }

  get selectedFileSize(): string {
    if (!this.selectedFile) return '';
    const mb = this.selectedFile.size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  /** تعبئة النموذج وقت التعديل */
  patchForm(file: any) {
    this.form.patchValue({
      file_name: file.file_name || '',
      file_type: this.mapMimeToEnumValue(file.file_type),
      book_id: file.book_id || null
    });

    // تعيين hasExistingFile لعرض المعاينة
    this.hasExistingFile = true;

    // عرض معاينة حسب نوع الملف
    if (file.file_url) {
      if (file.file_type.startsWith('image/')) {
        this.imagePreview = file.file_url;
        this.isImage = true;
        this.audioPreview = null;
      } else if (file.file_type.startsWith('audio/')) {
        this.audioPreview = file.file_url;
        this.isImage = false;
        this.imagePreview = null;
      } else {
        // للأنواع الأخرى (PDF, Document, etc.)
        this.isImage = false;
        this.imagePreview = null;
        this.audioPreview = null;
      }
    }

    // تحميل بيانات الكتاب إذا كان مرتبطاً
    if (file.book_id) {
      this.loadBookForEdit(file.book_id);
    }
  }

  /** 🧠 تحديد النوع تلقائيًا */
  private detectFileType(file: File): number {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (type.startsWith('image/')) return 1;
    if (type.includes('pdf') || type.includes('word') || name.match(/\.(pdf|doc|docx|txt|rtf)$/))
      return 2;
    if (type.startsWith('audio/')) return 3;
    return 4;
  }

  private mapMimeToEnumValue(type: string): number {
    if (!type) return 4;
    const t = type.toLowerCase();
    if (t.startsWith('image')) return 1;
    if (t.includes('pdf') || t.includes('word') || t.includes('doc')) return 2;
    if (t.startsWith('audio')) return 3;
    return 4;
  }

  // ---------- Drag & Drop ----------
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    if (!e.dataTransfer || e.dataTransfer.files.length === 0) return;
    this.handleFile(e.dataTransfer.files[0]);
  }

  onFileChange(event: any) {
    const file = event?.target?.files?.[0];
    if (file) this.handleFile(file);
  }

  /** عند اختيار ملف جديد */
  private handleFile(file: File) {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > this.MAX_SIZE_MB) {
      this.toastr.showError(`Max size is ${this.MAX_SIZE_MB} MB`);
      return;
    }

    this.selectedFile = file;
    this.hasExistingFile = false; // إعادة تعيين لأن هذا ملف جديد
    this.form.patchValue({ file });

    // 🔥 تحديد النوع تلقائياً
    const typeValue = this.detectFileType(file);
    this.form.patchValue({ file_type: typeValue });

    // 📝 الاسم
    const nameWOutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!this.form.value.file_name) {
      this.form.patchValue({ file_name: nameWOutExt });
    }

    // 🖼️ معاينة الصور
    this.isImage = file.type.startsWith('image/');
    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
      this.audioPreview = null;
    }
    // 🎧 معاينة الصوت
    else if (file.type.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.audioPreview = e.target.result;
      reader.readAsDataURL(file);
      this.imagePreview = null;
    }
    // 📄 باقي الأنواع
    else {
      this.imagePreview = null;
      this.audioPreview = null;
    }
  }


  clearFile() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.isImage = false;
    this.form.patchValue({ file: null, file_type: '' });
  }

  /** 🧩 رفع أو تعديل الملف */
  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const fd = new FormData();
    fd.append('file_name', this.form.value.file_name.trim());
    fd.append('type', this.form.value.file_type.toString());
    if (this.form.value.book_id) fd.append('book_id', String(this.form.value.book_id));
    if (this.selectedFile) fd.append('file', this.selectedFile);

    const url = this.isEdit
      ? this.api.files.edit(this.file.id)
      : this.api.files.add;

    const loaderKey = this.isEdit ? 'editFile' : 'addFile';

    this.httpService.action(url, fd, loaderKey).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.toastr.showSuccess(res.message || 'File saved successfully');
          this.activeModal.close(true);
        } else {
          this.toastr.showError(res.message || 'Operation failed');
        }
      },
      error: (err) => {
        const message = err?.response?.message || err?.message || 'Operation failed';
        this.toastr.showError(message);
      }
    });
  }

  // ---------- Books ----------
  loadBooks(searchQuery: string): void {
    this.isLoadingBooks$.next(true);
    const url = `${this.api.common.books}?q=${encodeURIComponent(searchQuery)}`;
    
    this.httpService.listGet(url, 'common-books').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          this.booksOptions = (res.data || []).map((book: any) => ({
            id: book.id,
            title: book.title,
            name: book.title,
            cover_image: book.cover_image
          }));
        } else {
          this.booksOptions = [];
        }
        this.isLoadingBooks$.next(false);
      },
      error: () => {
        this.booksOptions = [];
        this.isLoadingBooks$.next(false);
      }
    });
  }

  loadInitialBooks(): void {
    if (!this.initialBooksLoaded) {
      this.loadBooks('');
      this.initialBooksLoaded = true;
    }
  }

  onBookSearch(searchQuery: string): void {
    this.loadBooks(searchQuery);
  }

  // تحميل الكتاب أثناء التعديل
  loadBookForEdit(bookId: number): void {
    this.isLoadingBooks$.next(true);
    const url = `${this.api.common.books}?q=`;
    
    this.httpService.listGet(url, 'common-books-edit').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          const books = (res.data || []).map((book: any) => ({
            id: book.id,
            title: book.title,
            name: book.title,
            cover_image: book.cover_image
          }));
          
          // البحث عن الكتاب المطلوب
          const selectedBook = books.find((b: BookOption) => b.id === bookId);
          
          if (selectedBook) {
            this.booksOptions = books;
            // تعيين القيمة في النموذج
            this.form.patchValue({ book_id: bookId });
          } else {
            // إذا لم يُعثر على الكتاب في النتائج الأولية، نضيفه يدوياً
            this.booksOptions = books;
          }
          
          this.initialBooksLoaded = true;
        }
        this.isLoadingBooks$.next(false);
      },
      error: () => {
        this.booksOptions = [];
        this.isLoadingBooks$.next(false);
      }
    });
  }

  onBookSelectionChange(book: BookOption) {
    console.log('Selected book:', book);
  }

  getTypeLabel(typeNum: number): string {
    switch (typeNum) {
      case 1: return 'Image';
      case 2: return 'Document';
      case 3: return 'Audio';
      case 4: return 'Other';
      default: return 'Unknown';
    }
  }

}
