import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-add-edit-category',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {
  @Input() category: any;

  form: FormGroup;
  loading = false;
  submitted = false;
  selectedFile: File | null = null;
  imageUrl: string = 'assets/img/blank.png';

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrsService
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
      name: new FormControl(this.category?.name || '', Validators.required),
      image: new FormControl(this.category?.image || '', Validators.required)
    });
  }

  submit() {
  this.submitted = true;
  if (this.form.invalid) return;

  this.loading = true;

  setTimeout(() => {
    const result = {
      id: this.category?.id || Date.now(),
      name: this.form.value.name,
      image: this.imageUrl
    };

    this.toastr.Showsuccess(this.category ? 'Category updated' : 'Category added');
    this.activeModal.close(result);
    this.loading = false;
  }, 1000); // simulate delay
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
