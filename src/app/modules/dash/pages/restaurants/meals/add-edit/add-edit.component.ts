import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../../services/toater.service';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-add-edit-meal',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {
  @Input() meal: any;
  @Input() restaurantId: number;
  @Input() categories: any[] = [];

  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imageUrl: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrsService,
    public httpService: HttpService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.initForm();
    if (this.meal?.image) {
      this.imageUrl = this.meal.image;
    }
  }

  get f() {
    return this.form.controls;
  }

  get customizations() {
    return this.form.get('customizations') as FormArray;
  }

  initForm() {
    this.form = new FormGroup({
      nameEn: new FormControl(this.meal?.name || '', Validators.required),
      nameAr: new FormControl(this.meal?.name || '', Validators.required),
      cost: new FormControl(this.meal?.price || this.meal?.cost || '', [Validators.required, Validators.min(1)]),
      categoryId: new FormControl(this.meal?.categoryId || '', Validators.required),
      preparationTime: new FormControl(this.meal?.preparationTime || 15, [Validators.required, Validators.min(1)]),
      isPopular: new FormControl(this.meal?.isPopular || false),
      isPickedYou: new FormControl(this.meal?.isPickedYou || true),
      isActive: new FormControl(this.meal?.status === 'Active' || true),
      customizations: new FormArray([])
    });

    // Add existing customizations for edit mode
    if (this.meal?.customizations && this.meal.customizations.length > 0) {
      this.meal.customizations.forEach((customization: any) => {
        this.addCustomization(customization);
      });
    }
  }

  addCustomization(existingCustomization?: any) {
    const customizationGroup = new FormGroup({
      id: new FormControl(existingCustomization?.id || null),
      price: new FormControl(existingCustomization?.price || '', [Validators.required, Validators.min(0)]),
      nameEn: new FormControl(existingCustomization?.name || '', Validators.required),
      nameAr: new FormControl(existingCustomization?.name || '', Validators.required)
    });
    
    this.customizations.push(customizationGroup);
  }

  removeCustomization(index: number) {
    // Add simple removing animation
    const customizationElements = document.querySelectorAll('.customization-item');
    const targetElement = customizationElements[index];
    
    if (targetElement) {
      targetElement.classList.add('customization-removing');
      
      // Remove from FormArray after short animation
      setTimeout(() => {
        this.customizations.removeAt(index);
      }, 200);
    } else {
      // Fallback: remove immediately
      this.customizations.removeAt(index);
    }
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const formData = new FormData();
    formData.append('cost', this.form.value.cost);
    formData.append('translations[en][name]', this.form.value.nameEn);
    formData.append('translations[ar][name]', this.form.value.nameAr);
    formData.append('preparation_time', this.form.value.preparationTime);
    formData.append('is_popular', this.form.value.isPopular ? '1' : '0');
    formData.append('is_picked_you', this.form.value.isPickedYou ? '1' : '0');
    formData.append('is_active', this.form.value.isActive ? '1' : '0');
    formData.append('restaurant_id', this.restaurantId.toString());
    formData.append('category_id', this.form.value.categoryId);

    // Add customizations
    this.customizations.controls.forEach((customization, index) => {
      const customizationValue = customization.value;
      if (customizationValue.id) {
        formData.append(`customizations[${index}][id]`, customizationValue.id);
      }
      formData.append(`customizations[${index}][price]`, customizationValue.price);
      formData.append(`customizationTranslations[en][name]`, customizationValue.nameEn);
      formData.append(`customizationTranslations[ar][name]`, customizationValue.nameAr);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const url = this.meal ? this.api.meal.edit(this.meal.id) : this.api.meal.add;
    this.httpService.action(url, formData, 'addEditMeal').subscribe({
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
      };
      reader.readAsDataURL(file);
    }
  }
}
