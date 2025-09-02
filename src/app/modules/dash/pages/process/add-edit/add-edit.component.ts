import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-process',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public process: any;
  form: FormGroup;
  submitted = false;

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
      step: new FormControl(this.process?.step || '', [Validators.required, Validators.min(1)]),
      title: new FormControl(this.process?.title || '', Validators.required),
      description: new FormControl(this.process?.description || '', Validators.required)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const payload = {
        step: this.form.value.step,
        title: this.form.value.title,
        description: this.form.value.description
      };

      const url = this.process ? this.api.processes.edit(this.process.id) : this.api.processes.add;
      this.httpService.action(url, payload, 'addEditProcess').subscribe({
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
}
