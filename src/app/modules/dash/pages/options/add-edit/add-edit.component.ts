import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-add-edit-option',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public option: any;
  form: FormGroup;
  submitted = false;

  // Type options
  typeOptions = [
    { value: 'delivery_fee', label: 'Delivery Fee' },
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price' }
  ];

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
      name: new FormControl(this.option?.name || '', Validators.required),
      value: new FormControl(this.option?.value || '', [Validators.required, Validators.min(0)]),
      type: new FormControl(this.option?.type || '', Validators.required)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('name', this.form.value.name);
      formData.append('value', this.form.value.value.toString());
      formData.append('type', this.form.value.type);

      const url = this.option ? this.api.options.edit(this.option.id) : this.api.options.add;
      this.httpService.action(url, formData, 'addEditOption').subscribe({
        next: (res: any) => {
          if (res.success || res.status) {
            const message = this.option ? 'Option updated successfully' : 'Option created successfully';
            this.toastrsService.Showsuccess(message);
            this.activeModal.close(true);
          } else {
            this.toastrsService.Showerror(res.msg || res.message || 'Operation failed');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Operation failed';
          this.toastrsService.Showerror(errorMessage);
        }
      });
    }
  }
}
