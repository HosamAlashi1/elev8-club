import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-feature',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public feature: any;
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
    if (this.feature?.image) {
      this.imagePreview = this.feature.image;
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      title: new FormControl(this.feature?.title || '', [Validators.required]),
      description: new FormControl(this.feature?.description || '', [Validators.required]),
      image: new FormControl(null, this.feature ? [] : [Validators.required])
    });
  }

  onFileSelected(event: any): void {
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

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('title', this.form.value.title.trim());
      formData.append('description', this.form.value.description.trim());
      
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const url = this.feature ? this.api.features.edit(this.feature.id) : this.api.features.add;
      this.httpService.action(url, formData, 'addEditFeature').subscribe({
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
}
