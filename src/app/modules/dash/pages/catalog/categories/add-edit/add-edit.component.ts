import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ApiService } from '../../../../../services/api.service';
import { ToastrsService } from '../../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-category',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditCategoryComponent implements OnInit {

  @Input() category: any;
  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.category?.icon) {
      this.imagePreview = this.category.icon;
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      name: new FormControl(this.category?.name || '', Validators.required),
      description: new FormControl(this.category?.description || '', Validators.required),
      icon: new FormControl(null, this.category ? [] : [Validators.required]),
      status: new FormControl(this.category ? this.category.status === 'active' : true)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('name', this.form.value.name.trim());
      formData.append('description', this.form.value.description.trim());
      formData.append('status', this.form.value.status ? 'active' : 'inactive');

      if (this.selectedFile) {
        formData.append('icon', this.selectedFile);
      }

      // const url = this.category ? this.api.categories.edit(this.category.id) : this.api.categories.add;
      // this.httpService.action(url, formData, 'addEditCategory').subscribe({
      //   next: (res: any) => {
      //     if (res.status) {
      //       this.toastrsService.showSuccess(res.message || 'Category saved successfully');
      //       this.activeModal.close(true);
      //     } else {
      //       this.toastrsService.showError(res.message || 'Operation failed');
      //     }
      //   },
      //   error: (error: any) => {
      //     console.error('Error:', error);
      //     const errorMessage = error?.error?.message || error?.message || 'Operation failed';
      //     this.toastrsService.showError(errorMessage);
      //   }
      // });
      this.activeModal.close(true);

    }
  }


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

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.form.patchValue({ icon: file });

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

}
