import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ApiAdminService } from '../../../../../services/api.admin.service';
import { ToastrsService } from '../../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-category',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditCategoryComponent implements OnInit {

  @Input() category: any; // لو جاي تعديل
  form!: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

  get isEdit(): boolean {
    return !!this.category?.id;
  }

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();

    if (this.isEdit) {
      this.httpService.listGet(this.api.categories.details(this.category.id), 'category-details').subscribe({
        next: (res: any) => {
          if (res?.success && res?.data) {
            this.patchForm(res.data);
          } else {
            this.toastr.showError(res?.msg || 'Failed to load category');
          }
        },
        error: () => this.toastr.showError('Failed to load category')
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      name: new FormControl(this.category?.name || '', [Validators.required, Validators.maxLength(190)]),
      description: new FormControl(this.category?.description || '', [Validators.required]),
      file: new FormControl(null, this.isEdit ? [] : [Validators.required]) // مطلوب فقط عند الإضافة
    });
  }

  patchForm(cat: any) {
    this.form.patchValue({
      name: cat.name || '',
      description: cat.description || '',
      file: null
    });
    if (cat.image) {
      this.imagePreview = cat.image;
    }
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const formData = new FormData();
    formData.append('name', String(this.form.value.name).trim());
    formData.append('description', String(this.form.value.description).trim());

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    const url = this.isEdit
      ? this.api.categories.edit(this.category.id)
      : this.api.categories.add;

    this.httpService.action(url, formData, 'addEditCategory').subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastr.showSuccess(res?.msg || 'Category saved successfully');
          this.activeModal.close(true);
        } else {
          this.toastr.showError(res?.msg || 'Operation failed');
        }
      },
      error: (error: any) => {
        const msg = error?.error?.msg || error?.message || 'Operation failed';
        this.toastr.showError(msg);
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
