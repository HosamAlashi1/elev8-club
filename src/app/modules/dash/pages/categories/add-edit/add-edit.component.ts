import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../services/toater.service';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-add-edit-category',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {
  @Input() category: any;

  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imageUrl: string = 'assets/img/blank.png';

  // Type options
  typeOptions = [
    { value: 'meal', label: 'Meal' },
    { value: 'restaurant', label: 'Restaurant' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrsService,
    public httpService: HttpService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.initForm();
    if (this.category?.image) {
      this.imageUrl = this.category.image;
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      titleEn: new FormControl(this.category?.title || '', Validators.required),
      titleAr: new FormControl(this.category?.title || '', Validators.required),
      type: new FormControl(this.category?.type || 'meal', Validators.required),
      image: new FormControl(this.category?.image || null)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const formData = new FormData();
    formData.append('type', this.form.value.type);
    formData.append('translations[en][title]', this.form.value.titleEn);
    formData.append('translations[ar][title]', this.form.value.titleAr);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const url = this.category ? this.api.category.edit(this.category.id) : this.api.category.add;
    this.httpService.action(url, formData, 'addEditCategory').subscribe({
      next: (res: any) => {
        if (res.success || res.status) {
          this.toastr.Showsuccess(res.msg || res.message || 'Operation completed successfully');
          this.activeModal.close(true);
        } else {
          this.toastr.Showerror(res.msg || res.message || 'Operation failed');
        }
      },
      error: (error: any) => {
        console.error('Error:', error);
        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Operation failed';
        this.toastr.Showerror(errorMessage);
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
        this.form.get('image')?.setValue(this.imageUrl);
      };
      reader.readAsDataURL(file);
    }
  }
}
