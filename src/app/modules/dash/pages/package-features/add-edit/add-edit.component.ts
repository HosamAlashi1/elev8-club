import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-package-feature',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public packageFeature: any;
  public packages: any[] = [];
  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;

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
      package_id: new FormControl(this.packageFeature?.package_id || '', Validators.required),
      title: new FormControl(this.packageFeature?.title || '', Validators.required),
      description: new FormControl(this.packageFeature?.description || '', Validators.required),
      sort_order: new FormControl(this.packageFeature?.sort_order || 1, [Validators.required, Validators.min(1)]),
      image: new FormControl(null)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('package_id', this.form.value.package_id);
      formData.append('title', this.form.value.title);
      formData.append('description', this.form.value.description);
      formData.append('sort_order', this.form.value.sort_order);

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const url = this.packageFeature ? this.api.packageFeatures.edit(this.packageFeature.id) : this.api.packageFeatures.add;
      this.httpService.action(url, formData, 'addEditPackageFeature').subscribe({
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
    }
  }

}
