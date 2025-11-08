import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ApiAdminService } from '../../../../../services/api.admin.service';
import { ToastrsService } from '../../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-book',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditBookComponent implements OnInit {

  @Input() book: any; // لو جاي تعديل
  categoryOptions: { label: string; value: number }[] = [];

  form!: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

  categories: any[] = [];
  authors: any[] = [];
  authorsLoading = false;
  initialAuthorsLoaded = false;

  get isEdit(): boolean {
    return !!this.book?.id;
  }

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();
    this.initialAuthorsLoaded = false; // إعادة تعيين حالة التحميل
    this.loadCommonData();

    // لا نحتاج لمتابعة تغييرات category_id لأننا نستخدم reactive forms مباشرة

    if (this.isEdit) {
      this.httpService.listGet(this.api.books.details(this.book.id), 'book-details').subscribe({
        next: (res: any) => {
          if (res?.status && res?.data) {
            this.patchForm(res.data);
          } else {
            this.toastr.showError(res?.message || 'Failed to load book details');
          }
        },
        error: () => this.toastr.showError('Failed to load book details')
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  // 🧱 Initialize Form
  initForm() {
    this.form = new FormGroup({
      title: new FormControl(this.book?.title || '', [Validators.required, Validators.maxLength(190)]),
      isbn: new FormControl(this.book?.isbn || '', [Validators.required, Validators.maxLength(50)]),
      price: new FormControl(this.book?.price || 0, [Validators.required, Validators.min(0)]),
      stock: new FormControl(this.book?.stock || 0, [Validators.required, Validators.min(0)]),
      category_id: new FormControl(this.book?.category_id || null, [Validators.required]),
      author_id: new FormControl(this.book?.author_id || null, [Validators.required]),
      file: new FormControl(null, this.isEdit ? [] : [Validators.required])
    });

    // form control يتم تهيئته تلقائياً بالقيم الصحيحة
  }

  // 🧩 Load Categories & Authors from Common
  loadCommonData() {
    this.httpService.listGet(this.api.common.categories, 'common-categories').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          this.categories = res.data;
          this.categoryOptions = res.data.map((c: any) => ({
            label: c.name,
            value: c.id
          }));
        }
      },
      error: () => this.toastr.showError('Failed to load categories')
    });

    // لا نحمّل المؤلفين في البداية - سيتم تحميلهم عند فتح القائمة
  }

  // 🔍 Load Authors with search functionality
  loadAuthors(searchQuery: string = '') {
    this.authorsLoading = true;
    const url = searchQuery ?
      `${this.api.common.authors}?q=${encodeURIComponent(searchQuery)}` :
      this.api.common.authors;

    const currentAuthorId = this.form.get('author_id')?.value; // حفظ الاختيار الحالي

    this.httpService.listGet(url, 'common-authors').subscribe({
      next: (res: any) => {
        this.authorsLoading = false;
        if (res?.status && res?.data) {
          // Map the response data to match the expected format for authors
          this.authors = res.data.map((author: any) => ({
            id: author.id,
            full_name: author.full_name || author.name || author.title,
            name: author.name || author.full_name,
            ...author // Include any other properties
          }));

          // إذا كان هناك اختيار سابق ولم يعد موجود في النتائج الجديدة،
          // أضف المؤلف المختار لضمان استمرار ظهوره
          if (currentAuthorId && !this.authors.find(a => a.id === currentAuthorId)) {
            // البحث عن المؤلف في قائمة المؤلفين الأصلية إذا كان متوفراً
            console.log('Current author not in search results, keeping selection:', currentAuthorId);
          }
        } else {
          this.authors = [];
        }
      },
      error: () => {
        this.authorsLoading = false;
        this.authors = [];
        this.toastr.showError('Failed to load authors');
      }
    });
  }

  // 🔍 Load initial authors data when dropdown opens
  loadInitialAuthors() {
    if (!this.initialAuthorsLoaded) {
      this.initialAuthorsLoaded = true;
      this.loadAuthors(''); // Load initial data without search query
    }
  }

  // 🔍 Handle author search
  onAuthorSearch(searchQuery: string) {
    this.loadAuthors(searchQuery);
  }

  // 🔍 Load authors for edit mode - to find the current author ID
  loadAuthorsForEdit(authorName: string) {
    this.authorsLoading = true;
    
    // تحميل جميع المؤلفين لإيجاد المطابق
    this.httpService.listGet(this.api.common.authors, 'common-authors-edit').subscribe({
      next: (res: any) => {
        this.authorsLoading = false;
        if (res?.status && res?.data) {
          // تحويل البيانات
          this.authors = res.data.map((author: any) => ({
            id: author.id,
            full_name: author.full_name || author.name || author.title,
            name: author.name || author.full_name,
            ...author
          }));

          // البحث عن المؤلف المطابق
          const matchedAuthor = this.authors.find(
            a => a.full_name.trim().toLowerCase() === authorName.trim().toLowerCase()
          );

          if (matchedAuthor) {
            console.log(' Found matching author:', matchedAuthor);
            this.form.patchValue({ author_id: matchedAuthor.id });
            
            // تحديث الحالة أن البيانات الأولية تم تحميلها
            this.initialAuthorsLoaded = true;
          } else {
            console.log(' Author not found:', authorName, 'Available authors:', this.authors);
          }
        }
      },
      error: () => {
        this.authorsLoading = false;
        this.toastr.showError('Failed to load authors for editing');
      }
    });
  }

  updateCategoryFormControl(value: any) {
    const parsedValue = value ? Number(value) : null; // تأكد أنها رقم أو null
    const categoryControl = this.form.get('category_id');

    if (categoryControl) {
      categoryControl.setValue(parsedValue);
      categoryControl.markAsTouched();
      categoryControl.markAsDirty();
      categoryControl.updateValueAndValidity();
    }

    // console.log للتصحيح - يمكن إزالته لاحقاً
    console.log(' Updated Category:', {
      rawValue: value,
      parsedValue,
      controlValue: categoryControl?.value,
      valid: categoryControl?.valid,
      errors: categoryControl?.errors
    });
  }


  onCategoryChange(event: any) {
    const value = event?.value ?? null;
    console.log('Category selectionChange:', { event, value });
    this.updateCategoryFormControl(value);
  }

  // 🧩 Patch Data when Editing
  patchForm(book: any) {
    // 👇 أولاً خزن البيانات العامة
    this.form.patchValue({
      title: book.title || '',
      isbn: book.isbn || '',
      price: book.price || 0,
      stock: book.stock || 0,
      file: null
    });

    // 👇 معالجة الكاتيجوري
    if (book.category && this.categories.length > 0) {
      const matchedCategory = this.categories.find(
        c => c.name.trim().toLowerCase() === book.category.trim().toLowerCase()
      );

      if (matchedCategory) {
        this.form.patchValue({ category_id: matchedCategory.id });
      }
    } else {
      // في حال لسه الكاتيجوري ما انحملت وقت النداء
      const waitForCategories = setInterval(() => {
        if (this.categories.length > 0) {
          clearInterval(waitForCategories);
          const matchedCategory = this.categories.find(
            c => c.name.trim().toLowerCase() === book.category.trim().toLowerCase()
          );
          if (matchedCategory) {
            this.form.patchValue({ category_id: matchedCategory.id });
          }
        }
      }, 200);
    }

    // 👇 معالجة المؤلف - نحتاج لتحميل البيانات أولاً
    if (book.author) {
      this.loadAuthorsForEdit(book.author);
    }

    if (book.cover_image) {
      this.imagePreview = book.cover_image;
    }

    // تحديث واجهة المودرن سيلكت
    setTimeout(() => {
      this.form.get('category_id')?.updateValueAndValidity();
    }, 100);
  }


  // 💾 Submit Add/Edit
  submit() {
    this.submitted = true;

    console.log('Form submission:', {
      formValues: this.form.value,
      formValid: this.form.valid,
      formErrors: this.form.errors,
      categoryControlValid: this.form.get('category_id')?.valid,
      categoryControlValue: this.form.get('category_id')?.value,
      categoryControlErrors: this.form.get('category_id')?.errors
    });

    if (this.form.invalid) return;

    const formData = new FormData();
    formData.append('title', String(this.form.value.title).trim());
    formData.append('isbn', String(this.form.value.isbn).trim());
    formData.append('price', String(this.form.value.price));
    formData.append('stock', String(this.form.value.stock));
    formData.append('category_id', String(this.form.value.category_id));
    formData.append('author_id', String(this.form.value.author_id));

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    const url = this.isEdit
      ? this.api.books.edit(this.book.id)
      : this.api.books.add;

    const loaderKey = this.isEdit ? 'editBook' : 'addBook';

    this.httpService.action(url, formData, loaderKey).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.toastr.showSuccess(res?.message || 'Book saved successfully');
          this.activeModal.close(true);
        } else {
          this.toastr.showError(res?.message || 'Operation failed');
        }
      },
      error: (error: any) => {
        const message = error?.response?.message || error?.message || 'Operation failed';
        this.toastr.showError(message);
      }
    });
  }

  // 📂 File Handling
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files?.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.form.patchValue({ file });
    const reader = new FileReader();
    reader.onload = (e: any) => (this.imagePreview = e.target.result);
    reader.readAsDataURL(file);
  }
}
