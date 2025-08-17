import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-preview',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public preview: any;
  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.preview?.image) {
      this.imagePreview = this.preview.image;
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      image: new FormControl(null, this.preview ? [] : [Validators.required])
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid || (this.preview && !this.selectedFile)) {
      // For edit: allow submit without new image
      // For create: require image
      if (!this.preview && !this.selectedFile) {
        this.toastrsService.Showerror('Please select an image');
        return;
      }

      const formData = new FormData();
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const url = this.preview ? this.api.previews.edit(this.preview.id) : this.api.previews.add;
      this.httpService.action(url, formData, 'addEditPreview').subscribe({
        next: (res: any) => {
          if (res.status) {
            this.toastrsService.Showsuccess(res.message || 'Operation completed successfully');
            this.activeModal.close(true);
          } else {
            this.toastrsService.Showerror(res.message || 'Operation failed');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          const errorMessage = error?.error?.message || error?.message || 'Operation failed';
          this.toastrsService.Showerror(errorMessage);
        }
      });
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastrsService.Showerror('Please select a valid image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.toastrsService.Showerror('Image size should be less than 5MB');
        return;
      }

      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Clear validation error
      this.form.get('image')?.setErrors(null);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = this.preview?.image || null;
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    // Set validation error if it's a new preview
    if (!this.preview) {
      this.form.get('image')?.setErrors({ required: true });
    }
  }
}
