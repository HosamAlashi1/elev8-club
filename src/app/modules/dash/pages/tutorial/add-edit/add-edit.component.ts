import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-tutorial',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public tutorial: any;
  form: FormGroup;
  submitted = false;
  selectedImageFile: File | null = null;
  selectedVideoFile: File | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      title: new FormControl(this.tutorial?.title || '', Validators.required),
      description: new FormControl(this.tutorial?.description || '', Validators.required),
      step: new FormControl(this.tutorial?.step || 1, [Validators.required, Validators.min(1)]),
      image: new FormControl(null)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('title', this.form.value.title);
      formData.append('description', this.form.value.description);
      formData.append('step', this.form.value.step);

      if (this.selectedImageFile) {
        formData.append('image', this.selectedImageFile);
      }

      if (this.selectedVideoFile) {
        formData.append('video', this.selectedVideoFile);
      }

      const url = this.tutorial ? this.api.tutorial.edit(this.tutorial.id) : this.api.tutorial.add;
      this.httpService.action(url, formData, 'addEditTutorial').subscribe({
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

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
    }
  }

  onVideoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedVideoFile = file;
    }
  }

}
