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
  
  // Gallery properties
  galleryFiles: File[] = [];
  galleryPreviews: { preview: string; file?: File; id?: number }[] = [];
  isDragOver = false;
  
  // Gallery tracking for edit mode
  originalGalleryLength = 0; // Track original gallery count
  originalGalleryUrls: string[] = []; // Track original gallery URLs
  galleryChanged = false; // Flag to track if gallery was modified

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
    
    // Initialize gallery if editing
    if (this.meal?.galleries && this.meal.galleries.length > 0) {
      this.galleryPreviews = this.meal.galleries.map((gallery: any) => ({
        preview: gallery.image || gallery.url,
        id: gallery.id
      }));
      this.originalGalleryLength = this.galleryPreviews.length; // Store original count
      this.originalGalleryUrls = this.galleryPreviews.map(item => item.preview); // Store original URLs
      this.galleryChanged = false; // Reset change flag
    } else {
      this.originalGalleryLength = 0;
      this.originalGalleryUrls = [];
      this.galleryChanged = false;
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
      formData.append(`customizationTranslations[${index}][en][name]`, customizationValue.nameEn);
      formData.append(`customizationTranslations[${index}][ar][name]`, customizationValue.nameAr);
    });

    // Add gallery files to formData - Only send if changed in edit mode or if in add mode
    if (!this.meal) {
      // Add mode: always send gallery images
      this.galleryFiles.forEach((file, index) => {
        formData.append(`galleries[${index}][image]`, file);
      });
    } else if (this.meal && this.galleryChanged) {
      // Edit mode: only send if gallery was modified
      console.log('Gallery changed, sending ALL current gallery images (existing + new)...');
      
      // Send ALL current images (both existing and new files)
      let allImageIndex = 0;
      this.galleryPreviews.forEach((item) => {
        if (item.file instanceof File) {
          // New file uploaded
          formData.append(`galleries[${allImageIndex}][image]`, item.file);
          console.log(`Added galleries[${allImageIndex}][image]:`, item.file.name, '(NEW FILE)');
          allImageIndex++;
        } else if (item.id) {
          // Existing image - send ID to keep it
          formData.append(`existing_gallery_ids[${allImageIndex}]`, item.id.toString());
          console.log(`Added existing_gallery_ids[${allImageIndex}]:`, item.id, '(EXISTING ID)');
          allImageIndex++;
        }
      });
      
      // If gallery was changed but is now empty, send clear flag
      if (allImageIndex === 0) {
        formData.append('clear_gallery', '1');
        console.log('Added clear_gallery flag');
      }
    }

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

  // Gallery Methods
  triggerFileInput(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const fileInput = document.getElementById('galleryFileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onGalleryFilesChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processGalleryFiles(files);
    // Clear the input so the same file can be selected again
    event.target.value = '';
  }

  onGalleryDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      this.processGalleryFiles(imageFiles);
    }
  }

  onGalleryDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onGalleryDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  processGalleryFiles(files: File[]) {
    files.forEach(file => {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB max
        this.galleryFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = () => {
          this.galleryPreviews.push({
            preview: reader.result as string,
            file: file
          });
          this.galleryChanged = true; // Mark as changed
          this.checkGalleryChanges(); // Check for changes
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeGalleryImage(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const imageToRemove = this.galleryPreviews[index];
    
    // Remove from previews
    this.galleryPreviews.splice(index, 1);
    
    // If it's a new file, remove from galleryFiles
    if (imageToRemove.file) {
      const fileIndex = this.galleryFiles.indexOf(imageToRemove.file);
      if (fileIndex > -1) {
        this.galleryFiles.splice(fileIndex, 1);
      }
    }
    
    this.galleryChanged = true; // Mark as changed
    this.checkGalleryChanges(); // Check for changes
  }

  private checkGalleryChanges(): void {
    if (!this.meal) {
      // Add mode - always consider changed if files exist
      this.galleryChanged = this.galleryFiles.length > 0;
      return;
    }
    
    // Edit mode checks
    // Check if count changed
    if (this.galleryPreviews.length !== this.originalGalleryLength) {
      this.galleryChanged = true;
      console.log('Gallery changed: count changed', this.galleryPreviews.length, 'vs', this.originalGalleryLength);
      return;
    }
    
    // Check if any new files were added (has .file property)
    const hasNewFiles = this.galleryPreviews.some(item => item.file instanceof File);
    if (hasNewFiles) {
      this.galleryChanged = true;
      console.log('Gallery changed: new files added');
      return;
    }
    
    // Check if original images were removed by comparing URLs
    if (this.originalGalleryUrls.length > 0) {
      const currentUrls = this.galleryPreviews
        .filter(item => item.preview && !item.file)
        .map(item => item.preview);
      
      // Check if any original URL is missing
      const missingUrls = this.originalGalleryUrls.filter(originalUrl => 
        !currentUrls.includes(originalUrl)
      );
      
      if (missingUrls.length > 0) {
        this.galleryChanged = true;
        console.log('Gallery changed: original images were removed', missingUrls);
        return;
      }
    }
    
    // If we reach here, no changes detected
    this.galleryChanged = false;
    console.log('Gallery unchanged');
  }

  // Helper method to check if gallery has changes (for UI indication)
  get hasGalleryChanges(): boolean {
    return this.meal && this.galleryChanged;
  }
}
