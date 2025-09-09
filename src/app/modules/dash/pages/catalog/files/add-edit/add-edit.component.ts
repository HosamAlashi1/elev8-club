// upload-file.modal.ts
import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ApiService } from '../../../../../services/api.service';
import { ToastrsService } from '../../../../../services/toater.service';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';

type BookOption = { 
  id: number; 
  title: string; 
  name: string; // للـ searchable-select
  author?: string;
  isbn?: string;
};

@Component({
  selector: 'app-add-edit-file',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditFileComponent implements OnInit {

  /** Optional: preselect a book or type if جاي من سياق معيّن */
  @Input() preselectBookId?: number | null;
  @Input() preselectType?: 'image' | 'pdf' | 'audio' | 'video' | '';

  form!: FormGroup;
  submitted = false;

  // UI state
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isImage = false;
  isDragOver = false;

  // Select data
  fileTypeOptions = [
    { value: '', label: 'File Type' },
    { value: 'image', label: 'Image' },
    { value: 'pdf', label: 'PDF' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
  ];
  booksOptions: BookOption[] = [];
  isLoadingBooks$ = new BehaviorSubject<boolean>(false);

  // محاكاة قاعدة البيانات للكتب (100,000 كتاب)
  allBooksDatabase: BookOption[] = []; // جعلته public للـ template

  // accept attribute string
  acceptString = '*/*';

  // limits
  readonly MAX_SIZE_MB = 20;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastr: ToastrsService
  ) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      file: new FormControl(null, Validators.required),
      file_name: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      file_type: new FormControl(this.preselectType ?? '', Validators.required),
      book_id: new FormControl(this.preselectBookId ?? null)
    });

    this.updateAcceptString();
    this.initializeBooksDatabase();
    this.loadInitialBooks();
  }

  get f() { return this.form.controls; }

  get selectedFileSize(): string {
    if (!this.selectedFile) return '';
    const mb = this.selectedFile.size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
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

  onTypeChange() {
    this.updateAcceptString();

    // علّم الحقل إنه تغيّر وتحقق فورًا
    const ctrl = this.form.get('file_type');
    ctrl?.markAsDirty();
    ctrl?.markAsTouched();
    ctrl?.updateValueAndValidity();

    // لو فيه ملف مختار ومش متوافق مع النوع الجديد نحذفه وننبّه
    if (this.selectedFile && !this.isFileAllowed(this.selectedFile)) {
      this.clearFile();
      this.toastr.showError('Selected file does not match the chosen type.');
    }
  }

  // (اختياري) اسم النوع الحالي لو بدك تستخدمه في الهيدر/التلميحات
  get currentTypeLabel(): string {
    const v = this.form.get('file_type')?.value;
    return this.fileTypeOptions.find(o => o.value === v)?.label || 'File Type';
  }

  private updateAcceptString() {
    const t = this.form.get('file_type')?.value;
    switch (t) {
      case 'image': this.acceptString = 'image/*'; break;
      case 'pdf': this.acceptString = 'application/pdf'; break;
      case 'audio': this.acceptString = 'audio/*'; break;
      case 'video': this.acceptString = 'video/*'; break;
      default: this.acceptString = '*/*';
    }
  }

  private handleFile(file: File) {
    // الحجم
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > this.MAX_SIZE_MB) {
      this.toastr.showError(`Max size is ${this.MAX_SIZE_MB} MB`);
      return;
    }
    // النوع
    if (!this.isFileAllowed(file)) {
      this.toastr.showError('File type not allowed for the selected type.');
      return;
    }

    this.selectedFile = file;
    this.form.patchValue({ file });

    // املأ الاسم تلقائياً إذا كان فارغ
    const nameWOutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!this.form.value.file_name) {
      this.form.patchValue({ file_name: nameWOutExt });
    }

    // معاينة الصور فقط
    this.isImage = file.type.startsWith('image/');
    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
    } else {
      this.imagePreview = null;
    }
  }

  private isFileAllowed(file: File): boolean {
    const t = this.form.get('file_type')?.value;
    if (!t) return true; // لو لسه ما اختار نوع
    if (t === 'image') return file.type.startsWith('image/');
    if (t === 'pdf') return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (t === 'audio') return file.type.startsWith('audio/');
    if (t === 'video') return file.type.startsWith('video/');
    return true;
  }

  clearFile() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.isImage = false;
    this.form.patchValue({ file: null });
  }

  // ---------- Submit ----------
  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const fd = new FormData();
    fd.append('file', this.form.value.file);
    fd.append('file_name', this.form.value.file_name.trim());
    fd.append('type', this.form.value.file_type);
    if (this.form.value.book_id) fd.append('book_id', String(this.form.value.book_id));

    // بدّل الـ URL حسب API مشروعك
    // const url = this.api.files.upload; // مثال
    // this.httpService.action(url, fd, 'uploadFile').subscribe({
    //   next: (res: any) => {
    //     if (res.status) {
    //       this.toastr.showSuccess(res.message || 'File uploaded successfully');
    //       this.activeModal.close(true);
    //     } else {
    //       this.toastr.showError(res.message || 'Upload failed');
    //     }
    //   },
    //   error: (err) => this.toastr.showError(err?.error?.message || 'Upload failed')
    // });

    // لغاية ربط الـ API:
    this.activeModal.close(true);
  }

  // ---------- Data ----------
  private initializeBooksDatabase() {
    // محاكاة 100,000 كتاب
    const authors = ['Ahmed Ali', 'Sara Hassan', 'Mohammed Salem', 'Fatma Ibrahim', 'Omar Khalil', 'Nour Adel', 'Youssef Mahmoud', 'Aya Mostafa'];
    const categories = ['Fiction', 'Science', 'History', 'Philosophy', 'Art', 'Technology', 'Medicine', 'Literature'];
    
    for (let i = 1; i <= 100000; i++) {
      const author = authors[Math.floor(Math.random() * authors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const title = `${category} Book ${i} by ${author}`;
      
      this.allBooksDatabase.push({
        id: i,
        title: title,
        name: title, // للـ searchable-select
        author: author,
        isbn: `978-${Math.floor(Math.random() * 10000000000)}`
      });
    }
  }

  private loadInitialBooks() {
    // تحميل أول 10 كتب كـ default
    this.isLoadingBooks$.next(true);
    
    // محاكاة تأخير API
    setTimeout(() => {
      this.booksOptions = this.allBooksDatabase.slice(0, 10);
      this.isLoadingBooks$.next(false);
    }, 800);
  }

  searchBooks(query: string): Observable<BookOption[]> {
    if (!query || query.trim().length < 2) {
      return of(this.allBooksDatabase.slice(0, 10)).pipe(delay(300));
    }

    // محاكاة البحث
    this.isLoadingBooks$.next(true);
    
    const searchTerm = query.toLowerCase().trim();
    const results = this.allBooksDatabase
      .filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author?.toLowerCase().includes(searchTerm) ||
        book.isbn?.includes(searchTerm)
      )
      .slice(0, 20); // أقصى 20 نتيجة

    return of(results).pipe(
      delay(500), // محاكاة وقت API
      // إيقاف loading بعد الانتهاء
      // تم نقله للكومبوننت
    );
  }

  onBookSearch(query: string) {
    if (query && query.length >= 2) {
      this.searchBooks(query).subscribe(results => {
        this.booksOptions = results;
        this.isLoadingBooks$.next(false);
      });
    } else if (!query) {
      this.loadInitialBooks();
    }
  }

  onBookSelectionChange(book: BookOption) {
    // يمكن إضافة أي منطق إضافي هنا
    console.log('Selected book:', book);
  }

  private loadBooks() {
    // تم استبدالها بـ loadInitialBooks
    // استبدلها بنداءك الحقيقي لملء الخيارات
    // this.httpService.get(this.api.books.selectOptions).subscribe(...)
    // مؤقتاً داتا وهمية:
    this.booksOptions = [
      { id: 1, title: 'Book A', name: 'Book A' },
      { id: 2, title: 'Book B', name: 'Book B' },
      { id: 3, title: 'Book C', name: 'Book C' },
    ];
  }
}
