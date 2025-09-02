import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-package',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public package: any;
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
      name: new FormControl(this.package?.name || '', Validators.required),
      description: new FormControl(this.package?.description || '', Validators.required),
      price: new FormControl(this.package?.price || 0, [Validators.required, Validators.min(0)]),
      sort_order: new FormControl(this.package?.sort_order || 1, [Validators.required, Validators.min(1)]),
      image: new FormControl(null)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('name', this.form.value.name);
      formData.append('description', this.form.value.description);
      formData.append('price', this.form.value.price);
      formData.append('sort_order', this.form.value.sort_order);

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const url = this.package ? this.api.packages.edit(this.package.id) : this.api.packages.add;
      this.httpService.action(url, formData, 'addEditPackage').subscribe({
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
