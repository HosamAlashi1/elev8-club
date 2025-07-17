import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../services/toater.service';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-add-edit-user',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {
  @Input() user: any;

  form: FormGroup;
  loading = false;
  submitted = false;
  selectedFile: File | null = null;
  imageUrl: string = 'assets/img/blank.png';

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrsService,
    private api: ApiService,
    private httpService: HttpService
  ) {}

  ngOnInit() {
    this.initForm()
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    
    this.form = new FormGroup({
      name: new FormControl(this.user?.name || '', Validators.required),
      email: new FormControl(this.user?.email || '', [Validators.required, Validators.email]),
      phone: new FormControl(this.user?.phone || '', Validators.required),
      password: new FormControl('', this.user ? [] : [Validators.required, Validators.minLength(6)]),
      photo: new FormControl(this.user?.photo || ''),
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    // Prepare form data
    const formData = new FormData();
    formData.append('name', this.form.value.name);
    formData.append('email', this.form.value.email);
    formData.append('phone', this.form.value.phone);

    // Add password for create or if provided for update
    if (!this.user || (this.user && this.form.value.password)) {
      formData.append('password', this.form.value.password);
    }

    // Add photo if selected
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    const url = this.user ? this.api.user.edit(this.user.id) : this.api.user.add;
    const operationType = this.user ? 'updateUser' : 'createUser';

    this.httpService.action(url, formData, operationType).subscribe({
      next: (res: any) => {
        console.log('User API Response:', res); // Debug log
        
        if (res?.status) {
          const message = this.user ? 'User updated successfully' : 'User created successfully';
          this.toastr.Showsuccess(message);
          this.activeModal.close(res.items);
        } else {
          this.toastr.Showerror(res?.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('User operation error:', error);
        this.toastr.Showerror('Failed to save user');
        this.loading = false;
      }
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
        // Update form control value to mark as valid
        this.form.get('photo')?.setValue(this.imageUrl);
      };
      reader.readAsDataURL(file);
    }
  }
}
