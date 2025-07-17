import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-meal',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {
  @Input() meal: any;
  @Input() restaurantId: number;

  form: FormGroup;
  loading = false;
  submitted = false;
  selectedFiles: File[] = [];
  imageUrls: string[] = [];

  categories = [
    'Pizza', 'Burgers', 'Wraps', 'Sandwiches', 'Sides', 'Chicken', 
    'Pasta', 'Salads', 'Meals', 'Desserts', 'Drinks'
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrsService
  ) {}

  ngOnInit() {
    this.initForm();
    if (this.meal?.images && this.meal.images.length > 0) {
      this.imageUrls = [...this.meal.images];
    } else if (this.meal?.image) {
      // Handle legacy single image
      this.imageUrls = [this.meal.image];
    } 
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      name: new FormControl(this.meal?.name || '', Validators.required),
      category: new FormControl(this.meal?.category || '', Validators.required),
      price: new FormControl(this.meal?.price || '', [Validators.required, Validators.min(1)]),
      images: new FormControl(this.meal?.images || [], Validators.required)
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    setTimeout(() => {
      const result = {
        id: this.meal?.id || Date.now(),
        name: this.form.value.name,
        category: this.form.value.category,
        price: this.form.value.price,
        description: this.form.value.description,
        images: this.imageUrls.filter(url => url !== 'assets/img/blank.png'),
        status: this.meal?.status || 'Active',
        restaurant_id: this.meal?.restaurant_id || this.restaurantId || 1
      };

      this.toastr.Showsuccess(this.meal ? 'Meal updated' : 'Meal added');
      this.activeModal.close(result);
      this.loading = false;
    }, 1000); // simulate delay
  }

  onFileChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      this.selectedFiles = files;
      this.imageUrls = [];

      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.imageUrls.push(reader.result as string);
          
          // Update form control after all images are loaded
          if (this.imageUrls.length === files.length) {
            this.form.get('images')?.setValue(this.imageUrls);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    this.imageUrls.splice(index, 1);
    this.selectedFiles.splice(index, 1);
    this.form.get('images')?.setValue(this.imageUrls);
  }
}
