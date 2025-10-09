import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-testimonial',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public testimonial: any;
  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  ratings = [1, 2, 3, 4, 5];

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiAdminService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.testimonial?.image) {
      this.imagePreview = this.testimonial.image;
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      name: new FormControl(this.testimonial?.name || '', Validators.required),
      position: new FormControl(this.testimonial?.position || '', Validators.required),
      testimonial: new FormControl(this.testimonial?.testimonial || '', Validators.required),
      rating: new FormControl(this.testimonial?.rating || 5, [Validators.required, Validators.min(1), Validators.max(5)]),
      image: new FormControl(null, this.testimonial ? [] : [Validators.required])
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('name', this.form.value.name.trim());
      formData.append('position', this.form.value.position.trim());
      formData.append('testimonial', this.form.value.testimonial.trim());
      formData.append('rating', this.form.value.rating.toString());

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const url = this.testimonial ? this.api.testimonials.edit(this.testimonial.id) : this.api.testimonials.add;
      this.httpService.action(url, formData, 'addEditTestimonial').subscribe({
        next: (res: any) => {
          if (res.status) {
            this.toastrsService.showSuccess(res.message || 'Operation completed successfully');
            this.activeModal.close(true);
          } else {
            this.toastrsService.showError(res.message || 'Operation failed');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          const errorMessage = error?.error?.message || error?.message || 'Operation failed';
          this.toastrsService.showError(errorMessage);
        }
      });
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.form.patchValue({ image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((x, i) => i < rating ? 1 : 0);
  }
}
