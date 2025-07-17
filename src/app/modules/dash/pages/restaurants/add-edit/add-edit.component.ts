import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrsService } from '../../../services/toater.service';
import { RestaurantService } from '../../../services/restaurant.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  trigger,
  transition,
  style,
  animate,
  state
} from '@angular/animations';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';


@Component({
  selector: 'app-add-edit-restaurant',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
    ]),
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      state('out', style({ opacity: 0.5, transform: 'scale(0.95)' })),
      transition('out => in', [
        animate('300ms ease-in', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition('in => out', [
        animate('200ms ease-out', style({ opacity: 0.5, transform: 'scale(0.95)' }))
      ])
    ])
  ]

})
export class AddEditComponent implements OnInit {
  form!: FormGroup;
  submitted = false;

  // Track validation attempts per step (0-based index)
  stepValidationAttempted: boolean[] = [];

  mode: 'add' | 'edit' = 'add';
  restaurantId: number | null = null;
  center = { lat: 32.8872, lng: 13.1913 };  // Image previews
  imagePreview: string | ArrayBuffer | null = null;
  galleryPreviews: { file?: File; url?: string; preview: string | ArrayBuffer }[] = [];
  isDragOver = false;

  isSaving$ = new BehaviorSubject<boolean>(false);
  isLoadingLookups$ = new BehaviorSubject<boolean>(true);
  lookupsError$ = new BehaviorSubject<string | null>(null);

  // Flag to prevent multiple subscription setups
  private subscriptionsSetup = false;

  // Flag to track if we're in the initial population phase (edit mode)
  private isInitialPopulation = false;

  // Dynamic data from API
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  categories: any[] = [];
  cuisineTagsList: any[] = [];
  specialFeaturesList: any[] = [];

  // Static backup data (fallback)
  staticCountries: string[] = ['United States', 'Canada', 'Germany', 'Japan'];
  staticCities: string[] = ['New York', 'Los Angeles', 'Vancouver', 'Berlin', 'Tokyo'];
  staticStates: string[] = ['California', 'British Columbia', 'Berlin', 'Tokyo'];
  staticCategories = [
    'Pizza', 'Burgers', 'Wraps', 'Sandwiches', 'Sides', 'Chicken',
    'Pasta', 'Salads', 'Meals', 'Desserts', 'Drinks'
  ];

  // Operating days configuration
  days = [
    { name: 'Monday', key: 'mon', enabled: false, open: '10:00', close: '22:00' },
    { name: 'Tuesday', key: 'tue', enabled: false, open: '10:00', close: '22:00' },
    { name: 'Wednesday', key: 'wed', enabled: false, open: '10:00', close: '22:00' },
    { name: 'Thursday', key: 'thu', enabled: false, open: '10:00', close: '22:00' },
    { name: 'Friday', key: 'fri', enabled: false, open: '10:00', close: '22:00' },
    { name: 'Saturday', key: 'sat', enabled: false, open: '10:00', close: '22:00' },
    { name: 'Sunday', key: 'sun', enabled: false, open: '10:00', close: '22:00' },
  ];

  stepIndex: number = 0;
  stepTitles = [
    'General Info',
    'Location Info',
    'Contact Info',
    'Operating Hours',
    'Admin Info',
    'Delivery Settings',
    'Services & Pricing',
    'Gallery & Printer'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrsService,
    private restaurantService: RestaurantService,
    private api: ApiService,
    public httpService: HttpService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit(): void {
    this.restaurantId = +this.route.snapshot.params['id'] || null;
    this.mode = this.restaurantId ? 'edit' : 'add';

    // Initialize form first
    this.initForm();

    // Load lookups data first, then load restaurant data if in edit mode
    this.loadLookupData().then(() => {
      if (this.mode === 'edit') {
        this.loadRestaurantData();
      }
    });

    // Setup form value change subscriptions after form is initialized
    // Use setTimeout to ensure form is fully initialized
    setTimeout(() => {
      this.setupFormSubscriptions();
    }, 0);
  }

  private setupFormSubscriptions(): void {
    if (!this.form) {
      return;
    }

    if (this.subscriptionsSetup) {
      return;
    }

    this.subscriptionsSetup = true;

    // Subscribe to country changes
    this.form.get('country')?.valueChanges.subscribe((countryId: any) => {
      if (countryId) {
        this.onCountryChange(countryId);
      } else {
        // Clear states and cities when country is cleared
        this.states = [];
        this.cities = [];
        this.form.patchValue({ state: '', city: '' });
      }
    });

    // Subscribe to state changes  
    this.form.get('state')?.valueChanges.subscribe((stateId: any) => {
      if (stateId) {
        this.onStateChange(stateId);
      } else {
        // Clear cities when state is cleared
        this.cities = [];
        this.form.patchValue({ city: '' });
      }
    });

    // Maps URL subscription
    this.form.get('mapsUrl')?.valueChanges.subscribe((url: string) => {
      const coords = this.parseLatLngFromMapsUrl(url);
      if (coords) {
        this.form.patchValue({
          latitude: coords.lat,
          longitude: coords.lng
        });
        this.center = coords;
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  // Helper method to check if validation should be shown for current step
  shouldShowValidation(stepIndex: number): boolean {
    return this.stepValidationAttempted[stepIndex] || false;
  }

  initForm(): void {
    // Use default operating days configuration
    const operatingDays = this.days.map(day => ({
      name: day.name,
      key: day.key,
      enabled: day.enabled,
      open: day.open,
      close: day.close
    }));

    this.form = new FormGroup({
      // Step 1 - General Info
      name: new FormControl('', Validators.required),
      description: new FormControl(''),
      category: new FormControl([], this.categoryArrayValidator.bind(this)),
      image: new FormControl(null, this.mode === 'add' ? Validators.required : []),

      // Step 2 - Location Info
      address1: new FormControl('', Validators.required),
      address2: new FormControl(''),
      city: new FormControl('', Validators.required),
      state: new FormControl('', Validators.required),
      zipCode: new FormControl(''),
      country: new FormControl('', Validators.required),
      mapsUrl: new FormControl(''),
      latitude: new FormControl(null),
      longitude: new FormControl(null),

      // Step 3 - Contact Info
      phone: new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9\s-]+$/)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      website: new FormControl(''),
      facebook: new FormControl(''),
      instagram: new FormControl(''),
      twitter: new FormControl(''),

      // Step 4 - Operating Hours
      operatingDays: new FormArray(operatingDays.map(day =>
        new FormGroup({
          name: new FormControl(day.name),
          key: new FormControl(day.key),
          enabled: new FormControl(day.enabled),
          open: new FormControl(day.open),
          close: new FormControl(day.close)
        }, { validators: this.timeRangeValidator })
      )),

      // Step 5 - Admin Info
      adminName: new FormControl('', Validators.required),
      adminUserName: new FormControl('', Validators.required),
      adminPhone: new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9\s-]+$/)]),
      adminEmail: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', this.mode === 'add' ? [Validators.required, Validators.minLength(6)] : []),
      confirmPassword: new FormControl('', this.mode === 'add' ? Validators.required : []),

      // Step 6 - Delivery Settings
      delivery_time: new FormControl(30, []), // Will be set conditionally
      delivery_fee: new FormControl(0, []), // Will be set conditionally
      min_order_free_delivery: new FormControl(0, [Validators.min(0)]),
      min_order: new FormControl(0, []), // Will be set conditionally
      delivery_radius: new FormControl(10, []), // Will be set conditionally
      avg_meals_preparation_time: new FormControl(20, [Validators.required, Validators.min(1)]), // Always required
      takeaway_preparation_time: new FormControl(15, []), // Will be set conditionally

      // Step 7 - Services & Pricing
      offersDelivery: new FormControl(1), // Using numeric values (1 = Yes, 0 = No)
      dineIn: new FormControl(1), // Using numeric values (1 = Yes, 0 = No)
      takeaway: new FormControl(1), // Using numeric values (1 = Yes, 0 = No)
      cuisineTags: new FormControl([]), // Remove required validation temporarily
      specialFeatures: new FormControl([]),
      commissionRate: new FormControl(0, [Validators.min(0), Validators.max(100)]),
      tax_rate: new FormControl(0, [Validators.min(0), Validators.max(100)]),
      service_charge: new FormControl(0, [Validators.min(0)]),
      accountId: new FormControl(''),

      // Step 8 - Gallery & Printer
      gallery_images: new FormControl([]),
      ip_printer: new FormControl('')

    }, this.matchPasswordValidator);

    // Setup conditional form control logic
    this.setupConditionalControls();
  }

  private setupConditionalControls(): void {
    // Handle delivery-related fields based on offersDelivery
    this.form.get('offersDelivery')?.valueChanges.subscribe(offersDelivery => {
      this.toggleDeliveryFields(offersDelivery);
    });

    // Handle takeaway preparation time based on takeaway
    this.form.get('takeaway')?.valueChanges.subscribe(takeaway => {
      this.toggleTakeawayFields(takeaway);
    });

    // Set initial state based on current form values
    this.toggleDeliveryFields(this.form.get('offersDelivery')?.value);
    this.toggleTakeawayFields(this.form.get('takeaway')?.value);
  }

  private toggleDeliveryFields(offersDelivery: any): void {
    const deliveryFields = ['delivery_time', 'delivery_fee', 'min_order', 'min_order_free_delivery', 'delivery_radius'];
    const isDeliveryEnabled = offersDelivery == 1 || offersDelivery === true;

    deliveryFields.forEach(fieldName => {
      const control = this.form.get(fieldName);
      if (control) {
        if (isDeliveryEnabled) {
          control.enable({ emitEvent: false });
          // Add validation based on field type
          if (fieldName === 'delivery_time' || fieldName === 'delivery_fee' || fieldName === 'min_order' || fieldName === 'delivery_radius') {
            control.setValidators([Validators.required, Validators.min(0)]);
          } else if (fieldName === 'min_order_free_delivery') {
            control.setValidators([Validators.min(0)]); // Not required but must be >= 0
          }
        } else {
          control.disable({ emitEvent: false });
          control.clearValidators();
        }
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  private toggleTakeawayFields(takeaway: any): void {
    const takeawayControl = this.form.get('takeaway_preparation_time');
    const isTakeawayEnabled = takeaway == 1 || takeaway === true;

    if (takeawayControl) {
      if (isTakeawayEnabled) {
        takeawayControl.enable({ emitEvent: false });
        takeawayControl.setValidators([Validators.required, Validators.min(1)]);
      } else {
        takeawayControl.disable({ emitEvent: false });
        takeawayControl.clearValidators();
      }
      takeawayControl.updateValueAndValidity({ emitEvent: false });
    }
  }



  // Event handlers
  onDayToggle(index: number): void {
    const dayGroup = this.operatingDaysArray.at(index) as FormGroup;
    const enabled = dayGroup.get('enabled')?.value;

    if (!enabled) {
      dayGroup.patchValue({ open: '', close: '' });
    }
  }

  onFileChange(event: any, controlName: 'image'): void {
    const file = event.target.files[0];
    if (file) {
      this.form.get(controlName)?.setValue(file);
      this.form.get(controlName)?.markAsTouched();
      this.form.get(controlName)?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        if (controlName === 'image') this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Gallery Methods
  triggerFileInput(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const fileInput = document.querySelector('#galleryFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onGalleryFilesChange(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.addGalleryFiles(files);
    // Clear the input to allow re-selecting the same files
    event.target.value = '';
  }

  onGalleryDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.addGalleryFiles(files);
  }

  onGalleryDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onGalleryDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  private addGalleryFiles(files: File[]): void {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      this.toastr.ShowWarning('Only image files are allowed');
    }

    imageFiles.forEach(file => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.ShowWarning(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.galleryPreviews.push({
          file: file,
          preview: reader.result as string
        });
        this.updateGalleryFormControl();
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (index >= 0 && index < this.galleryPreviews.length) {
      this.galleryPreviews.splice(index, 1);
      this.updateGalleryFormControl();
    }
  }

  private updateGalleryFormControl(): void {
    const galleryData = this.galleryPreviews.map(item => item.file || item.url);
    this.form.get('gallery_images')?.setValue(galleryData);
  }

  // Custom validator for category array
  private categoryArrayValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { required: true };
    }
    return null;
  }

  // Validators
  timeRangeValidator(group: AbstractControl): { [key: string]: any } | null {
    const enabled = group.get('enabled')?.value;
    const open = group.get('open')?.value;
    const close = group.get('close')?.value;

    if (enabled && open && close && close <= open) {
      return { invalidTimeRange: true };
    }
    return null;
  }

  matchPasswordValidator(control: AbstractControl): { [key: string]: any } | null {
    const group = control as FormGroup;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      group.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      const errors = this.getFormValidationErrors(this.form);
      console.warn('Form submission failed due to the following errors:', errors);

      if (errors.length > 0) {
        const errorMessages = errors.map(e => `• ${e.control}: ${e.error}`).join('<br>');
        this.toastr.Showerror(`Please fix the following errors before submitting:<br>${errorMessages}`);
      } else {
        this.toastr.Showerror('The form contains invalid fields. Please check and try again.');
      }

      return;
    }

    this.isSaving$.next(true);

    if (this.mode === 'add') {
      this.createRestaurant();
    } else {
      this.updateRestaurant();
    }
  }

  private createRestaurant(): void {
    const formData = this.buildFormData();

    // Debug: Log the form data being sent
    this.debugFormData(formData);

    // Also log the form values for debugging
    console.log('Form Values:', this.form.value);

    this.httpService.action(this.api.restaurants.add, formData, 'addRestaurant').subscribe({
      next: (response: any) => {
        this.isSaving$.next(false);

        if (response?.success || response?.status) {
          this.toastrsService.Showsuccess(response?.message || response?.msg || 'Restaurant created successfully');
          this.submitted = false;
          this.router.navigate(['/restaurants']);
        } else {
          this.toastrsService.Showerror(response?.message || response?.msg || 'Failed to create restaurant');
        }
      },
      error: (error: any) => {
        this.isSaving$.next(false);
        console.error('Create restaurant error:', error);

        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Failed to create restaurant';
        this.toastrsService.Showerror(errorMessage);

        // Handle validation errors from backend
        if (error?.error?.errors) {
          this.handleBackendValidationErrors(error.error.errors);
        }
      }
    });
  }

  private updateRestaurant(): void {
    if (!this.restaurantId) {
      this.toastrsService.Showerror('Restaurant ID is missing');
      this.isSaving$.next(false);
      return;
    }

    const formData = this.buildFormData();

    this.httpService.action(this.api.restaurants.edit(this.restaurantId), formData, 'updateRestaurant').subscribe({
      next: (response: any) => {
        this.isSaving$.next(false);

        if (response?.success || response?.status) {
          this.toastrsService.Showsuccess(response?.message || response?.msg || 'Restaurant updated successfully');
          this.submitted = false;
          this.router.navigate(['/restaurants']);
        } else {
          this.toastrsService.Showerror(response?.message || response?.msg || 'Failed to update restaurant');
        }
      },
      error: (error: any) => {
        this.isSaving$.next(false);
        console.error('Update restaurant error:', error);

        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Failed to update restaurant';
        this.toastrsService.Showerror(errorMessage);

        // Handle validation errors from backend
        if (error?.error?.errors) {
          this.handleBackendValidationErrors(error.error.errors);
        }
      }
    });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.form.value;

    // Basic restaurant information
    formData.append('name', formValue.name || '');
    formData.append('description', formValue.description || '');

    // Handle category as array (category_id[])
    if (formValue.category && Array.isArray(formValue.category) && formValue.category.length > 0) {
      const validCategoryIds = formValue.category
        .map((cat: any) => {
          // Handle both ID values and objects with ID property
          if (typeof cat === 'object' && cat.id) {
            return cat.id;
          }
          return cat;
        })
        .filter((id: any) => id && id !== '' && id !== null && id !== undefined);

      validCategoryIds.forEach((categoryId: any, index: number) => {
        formData.append(`category_id[${index}]`, categoryId.toString());
      });
    }

    // Location information
    formData.append('address', formValue.address1 || '');
    if (formValue.address2) {
      formData.append('address_line_2', formValue.address2);
    }
    formData.append('city_id', formValue.city || '');
    formData.append('state_id', formValue.state || '');
    formData.append('country_id', formValue.country || '');
    if (formValue.zipCode) {
      formData.append('zip_postal_code', formValue.zipCode);
    }
    if (formValue.mapsUrl) {
      formData.append('google_maps_url', formValue.mapsUrl);
    }

    if (formValue.latitude) {
      formData.append('latitude', formValue.latitude.toString());
    }
    if (formValue.longitude) {
      formData.append('longitude', formValue.longitude.toString());
    }

    // Contact information
    formData.append('phone_number', formValue.phone || '');
    formData.append('email', formValue.email || '');
    if (formValue.website) {
      formData.append('website_url', formValue.website);
    }
    if (formValue.facebook) {
      formData.append('facebook_url', formValue.facebook);
    }
    if (formValue.instagram) {
      formData.append('instagram_url', formValue.instagram);
    }
    if (formValue.twitter) {
      formData.append('twitter_url', formValue.twitter);
    }

    // Operating hours - day[], time_from[], time_to[]
    const enabledDays = this.operatingDaysArray.controls
      .filter(day => day.get('enabled')?.value)
      .map(day => ({
        day: this.mapDayKeyToFullName(day.get('key')?.value),
        open: day.get('open')?.value,
        close: day.get('close')?.value
      }))
      .filter(day => day.day && day.open && day.close); // Filter out invalid entries

    if (enabledDays.length > 0) {
      enabledDays.forEach((day, index) => {
        formData.append(`day[${index}]`, day.day);
        formData.append(`time_from[${index}]`, day.open); // Use H:i format (e.g., "10:00")
        formData.append(`time_to[${index}]`, day.close); // Use H:i format (e.g., "22:00")
      });
    }

    // Admin information
    formData.append('admin_name', formValue.adminName || '');
    formData.append('admin_username', formValue.adminUserName || '');
    formData.append('admin_phone', formValue.adminPhone || '');
    formData.append('admin_email', formValue.adminEmail || '');

    if (this.mode === 'add' || formValue.password) {
      formData.append('admin_password', formValue.password || '');
    }

    // Delivery settings
    formData.append('delivery_time', formValue.delivery_time?.toString() || '30');
    formData.append('delivery_fee', formValue.delivery_fee?.toString() || '0');
    formData.append('min_order_free_delivery', formValue.min_order_free_delivery?.toString() || '0');
    formData.append('min_order', formValue.min_order?.toString() || '0');
    formData.append('delivery_radius', formValue.delivery_radius?.toString() || '10');
    formData.append('avg_meals_preparation_time', formValue.avg_meals_preparation_time?.toString() || '20');
    formData.append('takeaway_preparation_time', formValue.takeaway_preparation_time?.toString() || '15');

    // Services and pricing - ensure these are sent as "1" or "0" strings
    const isDelivery = formValue.offersDelivery == 1 || formValue.offersDelivery === true ? '1' : '0';
    const isDineIn = formValue.dineIn == 1 || formValue.dineIn === true ? '1' : '0';
    const isTakeaway = formValue.takeaway == 1 || formValue.takeaway === true ? '1' : '0';

    formData.append('is_delivery', isDelivery);
    formData.append('is_dine_in', isDineIn);
    formData.append('is_takeaway', isTakeaway);
    formData.append('commission_system_rate', formValue.commissionRate?.toString() || '0');
    formData.append('tax_rate', formValue.tax_rate?.toString() || '0');
    formData.append('service_charge', formValue.service_charge?.toString() || '0');
    formData.append('account_payment_details', formValue.accountId || '');

    // Tags and features arrays - only add if they have valid values
    if (formValue.cuisineTags && Array.isArray(formValue.cuisineTags) && formValue.cuisineTags.length > 0) {
      const validTagIds = formValue.cuisineTags
        .map((tag: any) => {
          // Handle both ID values and objects with ID property
          if (typeof tag === 'object' && tag.id) {
            return tag.id;
          }
          return tag;
        })
        .filter((id: any) => id && id !== '' && id !== null && id !== undefined);

      validTagIds.forEach((tagId: any, index: number) => {
        formData.append(`tags[${index}]`, tagId.toString());
      });
    }

    if (formValue.specialFeatures && Array.isArray(formValue.specialFeatures) && formValue.specialFeatures.length > 0) {
      const validFeatureIds = formValue.specialFeatures
        .map((feature: any) => {
          // Handle both ID values and objects with ID property
          if (typeof feature === 'object' && feature.id) {
            return feature.id;
          }
          return feature;
        })
        .filter((id: any) => id && id !== '' && id !== null && id !== undefined);

      validFeatureIds.forEach((featureId: any, index: number) => {
        formData.append(`features[${index}]`, featureId.toString());
      });
    }

    // Main image file
    if (formValue.image instanceof File) {
      formData.append('image', formValue.image);
    }

    // Gallery images array
    if (this.galleryPreviews && this.galleryPreviews.length > 0) {
      this.galleryPreviews.forEach((item, index) => {
        if (item.file instanceof File) {
          formData.append(`gallery_images[${index}]`, item.file);
        }
      });
    }

    // Printer settings
    formData.append('ip_printer', formValue.ip_printer || '');

    this.debugFormData(formData); // Debugging line

    return formData;
  }

  private debugFormData(formData: FormData): void {
    console.log('=== FormData Debug ===');
    for (let pair of (formData as any).entries()) {
      console.log(pair[0], ':', pair[1]);
    }
    console.log('=== End FormData Debug ===');
  }

  private handleBackendValidationErrors(errors: any): void {
    // Handle backend validation errors by showing them to user
    Object.keys(errors).forEach(field => {
      const errorMessages = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
      errorMessages.forEach((message: string) => {
        this.toastrsService.ShowWarning(`${field}: ${message}`);
      });
    });
  }

  deleteRestaurant(): void {
    if (!this.restaurantId) {
      this.toastrsService.Showerror('Restaurant ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      return;
    }

    this.isSaving$.next(true);

    this.httpService.action(this.api.restaurants.delete(this.restaurantId), {}, 'deleteRestaurant').subscribe({
      next: (response: any) => {
        this.isSaving$.next(false);

        if (response?.success || response?.status) {
          this.toastrsService.Showsuccess(response?.message || response?.msg || 'Restaurant deleted successfully');
          this.router.navigate(['/restaurants']);
        } else {
          this.toastrsService.Showerror(response?.message || response?.msg || 'Failed to delete restaurant');
        }
      },
      error: (error: any) => {
        this.isSaving$.next(false);
        console.error('Delete restaurant error:', error);

        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Failed to delete restaurant';
        this.toastrsService.Showerror(errorMessage);
      }
    });
  }

  getFormValidationErrors(formGroup: FormGroup | FormArray, parentKey: string = ''): { control: string, error: string }[] {
    const errors: { control: string, error: string }[] = [];

    // ✅ أولاً: التحقق من أخطاء المجموعة نفسها
    if (formGroup.errors) {
      Object.keys(formGroup.errors).forEach(errorKey => {
        errors.push({
          control: parentKey || 'form',
          error: this.getErrorMessage(errorKey, formGroup.errors![errorKey])
        });
      });
    }

    // ✅ ثانياً: التحقق من الحقول الفردية والمجموعات الفرعية
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      if (control instanceof FormGroup || control instanceof FormArray) {
        errors.push(...this.getFormValidationErrors(control, parentKey ? `${parentKey}.${key}` : key));
      } else if (control && control.invalid) {
        const controlErrors = control.errors;
        if (controlErrors) {
          Object.keys(controlErrors).forEach(errorKey => {
            errors.push({
              control: parentKey ? `${parentKey}.${key}` : key,
              error: this.getErrorMessage(errorKey, controlErrors[errorKey])
            });
          });
        } else {
          errors.push({
            control: parentKey ? `${parentKey}.${key}` : key,
            error: 'Invalid value.'
          });
        }
      }
    });

    return errors;
  }

  getErrorMessage(errorKey: string, errorValue: any): string {
    switch (errorKey) {
      case 'required':
        return 'This field is required.';
      case 'email':
        return 'Invalid email address.';
      case 'pattern':
        return 'Invalid format.';
      case 'min':
        return `Minimum value is ${errorValue.min}`;
      case 'max':
        return `Maximum value is ${errorValue.max}`;
      case 'invalidLocation':
        return 'Please select a valid location.';
      case 'invalidTimeRange':
        return 'Closing time must be after opening time.';
      case 'locationConflict':
        return 'Please fill either Google Maps URL or select a location on the map — not both.';
      default:
        return 'Invalid value.';
    }
  }


  onCancel(): void {
    this.router.navigate(['/restaurants']);
  }

  nextStep(): void {
    // Mark this step as having validation attempted
    this.stepValidationAttempted[this.stepIndex] = true;

    if (!this.validateStep()) return;

    if (this.stepIndex < this.stepTitles.length - 1) {
      this.stepIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.stepIndex > 0) {
      this.stepIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateStep(): boolean {
    const currentStepIsValid = this.isStepValid(this.stepIndex);

    if (!currentStepIsValid) {
      // Show specific validation messages for current step
      this.showStepValidationErrors(this.stepIndex);
    }

    return currentStepIsValid;
  }

  private isStepValid(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0: // General Info
        return this.f['name'].valid &&
          this.f['category'].valid &&
          (this.mode === 'edit' || this.f['image'].valid); // Image not required for edit

      case 1: // Location Info
        return this.f['address1'].valid &&
          this.f['city'].valid &&
          this.f['state'].valid &&
          this.f['country'].valid;

      case 2: // Contact Info
        return this.f['phone'].valid &&
          this.f['email'].valid;

      case 3: // Operating Hours
        // Check that at least one day is enabled and has valid times
        let hasValidDay = false;
        let errorMsg = '';

        for (let i = 0; i < this.operatingDaysArray.length; i++) {
          const group = this.getOperatingDayGroup(i);
          if (group.get('enabled')?.value) {
            const open = group.get('open')?.value;
            const close = group.get('close')?.value;

            if (!open || !close) {
              errorMsg = `Please set open and close time for ${group.get('name')?.value}`;
              break;
            }
            if (close <= open) {
              errorMsg = `${group.get('name')?.value}: Closing time must be after opening time`;
              break;
            }
            hasValidDay = true;
          }
        }

        if (!hasValidDay && !errorMsg) {
          errorMsg = 'Please enable at least one operating day';
        }

        return hasValidDay && !errorMsg;

      case 4: // Admin Info
        const adminValid = this.f['adminName'].valid &&
          this.f['adminUserName'].valid &&
          this.f['adminPhone'].valid &&
          this.f['adminEmail'].valid;

        if (this.mode === 'add') {
          return adminValid && this.f['password'].valid && this.f['confirmPassword'].valid;
        }

        // For edit mode, password is optional but if provided, must be valid
        if (this.f['password'].value) {
          return adminValid && this.f['password'].valid && this.f['confirmPassword'].valid;
        }

        return adminValid;

      case 5: // Delivery Settings
        const deliveryEnabled = this.f['offersDelivery'].value == 1 || this.f['offersDelivery'].value === true;
        const takeawayEnabled = this.f['takeaway'].value == 1 || this.f['takeaway'].value === true;

        // Always required fields regardless of delivery/takeaway settings
        const avgMealsValid = this.f['avg_meals_preparation_time'].valid;

        // Delivery-specific validation
        let deliveryValid = true;
        if (deliveryEnabled) {
          deliveryValid = this.f['delivery_time'].valid &&
            this.f['delivery_fee'].valid &&
            this.f['min_order'].valid &&
            this.f['min_order_free_delivery'].valid &&
            this.f['delivery_radius'].valid;
        }

        // Takeaway-specific validation
        let takeawayValid = true;
        if (takeawayEnabled) {
          takeawayValid = this.f['takeaway_preparation_time'].valid;
        }

        return avgMealsValid && deliveryValid && takeawayValid;

      case 6: // Services & Pricing
        return true; // Make cuisineTags optional for now

      case 7: // Gallery & Printer
        return true; // Optional fields

      default:
        return true;
    }
  }

  private showStepValidationErrors(stepIndex: number): void {
    switch (stepIndex) {
      case 0:
        if (!this.f['name'].valid) {
          this.toastr.Showerror('Restaurant name is required');
        } else if (!this.f['category'].valid) {
          this.toastr.Showerror('Category selection is required');
        } else if (this.mode === 'add' && !this.f['image'].valid) {
          this.toastr.Showerror('Restaurant image is required');
        }
        break;

      case 1:
        if (!this.f['address1'].valid) {
          this.toastr.Showerror('Address is required');
        } else if (!this.f['country'].valid) {
          this.toastr.Showerror('Country selection is required');
        } else if (!this.f['state'].valid) {
          this.toastr.Showerror('State/Province selection is required');
        } else if (!this.f['city'].valid) {
          this.toastr.Showerror('City selection is required');
        }
        break;

      case 2:
        if (!this.f['phone'].valid) {
          this.toastr.Showerror('Valid phone number is required');
        } else if (!this.f['email'].valid) {
          this.toastr.Showerror('Valid email address is required');
        }
        break;

      case 3:
        let hasEnabledDay = false;
        for (let i = 0; i < this.operatingDaysArray.length; i++) {
          const group = this.getOperatingDayGroup(i);
          if (group.get('enabled')?.value) {
            hasEnabledDay = true;
            if (!group.get('open')?.value || !group.get('close')?.value) {
              this.toastr.Showerror(`Please set open and close time for ${group.get('name')?.value}`);
              return;
            }
            if (group.get('close')?.value <= group.get('open')?.value) {
              this.toastr.Showerror(`${group.get('name')?.value}: Closing time must be after opening time`);
              return;
            }
          }
        }
        if (!hasEnabledDay) {
          this.toastr.Showerror('Please enable at least one operating day');
        }
        break;

      case 4:
        if (!this.f['adminName'].valid) {
          this.toastr.Showerror('Admin name is required');
        } else if (!this.f['adminUserName'].valid) {
          this.toastr.Showerror('Admin username is required');
        } else if (!this.f['adminPhone'].valid) {
          this.toastr.Showerror('Admin phone number is required');
        } else if (!this.f['adminEmail'].valid) {
          this.toastr.Showerror('Admin email address is required');
        } else if (this.mode === 'add' && !this.f['password'].valid) {
          this.toastr.Showerror('Password is required (minimum 6 characters)');
        } else if (this.mode === 'add' && !this.f['confirmPassword'].valid) {
          this.toastr.Showerror('Password confirmation is required');
        } else if (this.f['password'].value && !this.f['password'].valid) {
          this.toastr.Showerror('Password must be at least 6 characters');
        } else if (this.f['password'].value && !this.f['confirmPassword'].valid) {
          this.toastr.Showerror('Password confirmation does not match');
        }
        break;

      case 5:
        const deliveryEnabled5 = this.f['offersDelivery'].value == 1 || this.f['offersDelivery'].value === true;
        const takeawayEnabled5 = this.f['takeaway'].value == 1 || this.f['takeaway'].value === true;

        // Check average meal preparation time (always required)
        if (!this.f['avg_meals_preparation_time'].valid) {
          this.toastr.Showerror('Average meal preparation time is required');
        }
        // Check delivery-specific fields only if delivery is enabled
        else if (deliveryEnabled5 && !this.f['delivery_time'].valid) {
          this.toastr.Showerror('Delivery time is required when delivery is enabled');
        } else if (deliveryEnabled5 && !this.f['delivery_fee'].valid) {
          this.toastr.Showerror('Delivery fee is required when delivery is enabled');
        } else if (deliveryEnabled5 && !this.f['min_order'].valid) {
          this.toastr.Showerror('Minimum order amount is required when delivery is enabled');
        } else if (deliveryEnabled5 && !this.f['delivery_radius'].valid) {
          this.toastr.Showerror('Delivery radius is required when delivery is enabled');
        } else if (deliveryEnabled5 && !this.f['min_order_free_delivery'].valid) {
          this.toastr.Showerror('Minimum order for free delivery is required when delivery is enabled');
        }
        // Check takeaway-specific fields only if takeaway is enabled
        else if (takeawayEnabled5 && !this.f['takeaway_preparation_time'].valid) {
          this.toastr.Showerror('Takeaway preparation time is required when takeaway is enabled');
        }
        break;

      case 6:
        // No validation errors for step 6 for now
        break;

      default:
        this.toastr.Showerror('Please check all required fields');
        break;
    }
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (lat && lng) {
      this.form.patchValue({
        latitude: lat,
        longitude: lng,
        mapsUrl: `https://www.google.com/maps/@${lat},${lng},18z`
      });
      this.center = { lat, lng };
    }
  }

  parseLatLngFromMapsUrl(url: string): { lat: number; lng: number } | null {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    return null;
  }

  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    fullscreenControl: true,
    scrollwheel: true,
    disableDefaultUI: false
  };

  markerOptions: google.maps.MarkerOptions = {
    draggable: true
  };

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    const coords = event.latLng?.toJSON();
    if (coords) {
      this.form.patchValue({
        latitude: coords.lat,
        longitude: coords.lng,
        mapsUrl: `https://maps.google.com/?q=${coords.lat},${coords.lng}`
      });
      this.center = coords;
    }
  }

  get operatingDaysArray(): FormArray {
    return this.form.get('operatingDays') as FormArray;
  }

  getOperatingDayGroup(index: number): FormGroup {
    return this.operatingDaysArray.at(index) as FormGroup;
  }

  loadLookupData(): Promise<void> {
    this.isLoadingLookups$.next(true);

    return new Promise((resolve, reject) => {
      this.httpService.listGet(this.api.dashboard.lookups, 'lookups').subscribe({
        next: (response: any) => {
          if (response?.status && response?.items) {
            this.handleLookupData(response.items);
            resolve();
          } else {
            this.handleLookupError('Invalid response format');
            reject(new Error('Invalid response format'));
          }
        },
        error: (error: any) => {
          console.error('Failed to load lookup data:', error);
          this.handleLookupError('Failed to load dropdown data');
          reject(error);
        }
      });
    });
  }

  retryLoadLookups(): void {
    this.lookupsError$.next(null);
    this.loadLookupData().catch(error => {
      console.error('Retry load lookups failed:', error);
    });
  }

  private handleLookupData(items: any): void {
    try {
      // Countries
      if (items.countries && Array.isArray(items.countries)) {
        this.countries = items.countries.map((country: any) => ({
          id: country.id,
          name: country.name,
          phone_code: country.phone_code,
          currency: country.currency,
          flag: country.flag,
          states: country.states || []
        }));
      }

      // Categories
      if (items.categories && Array.isArray(items.categories)) {
        this.categories = items.categories.map((category: any) => ({
          id: category.id,
          name: category.title,
          // image: category.image,
          type: category.type
        }));
      }

      // Cuisine Tags
      if (items.tags && Array.isArray(items.tags)) {
        this.cuisineTagsList = items.tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          full_name: tag.name,
          image: '',
          created_at: tag.created_at
        }));
      }

      // Special Features
      if (items.features && Array.isArray(items.features)) {
        this.specialFeaturesList = items.features.map((feature: any) => ({
          id: feature.id,
          name: feature.name,
          full_name: feature.name,
          image: '',
          created_at: feature.created_at
        }));
      }

      this.isLoadingLookups$.next(false);
      this.lookupsError$.next(null);

    } catch (error) {
      console.error('Error processing lookup data:', error);
    }
  }

  private handleLookupError(message: string): void {
    console.warn(message + ', using fallback data');

    // Use static fallback data
    this.countries = this.staticCountries.map((name, index) => ({
      id: index + 1,
      name,
      flag: '🌍',
      states: []
    }));

    this.categories = this.staticCategories.map((title, index) => ({
      id: index + 1,
      title,
      image: ''
    }));

    this.cuisineTagsList = [
      { id: 1, name: 'Italian', full_name: 'Italian', image: '' },
      { id: 2, name: 'Vegetarian', full_name: 'Vegetarian', image: '' },
      { id: 3, name: 'Halal', full_name: 'Halal', image: '' }
    ];

    this.specialFeaturesList = [
      { id: 1, name: 'Outdoor Seating', full_name: 'Outdoor Seating', image: '' },
      { id: 2, name: 'WiFi', full_name: 'WiFi', image: '' },
      { id: 3, name: 'Parking', full_name: 'Parking', image: '' }
    ];

    this.isLoadingLookups$.next(false);
    this.lookupsError$.next(message);
    this.toastrsService.ShowWarning(message + '. Using default options.');

    // Initialize form with fallback data
    if (!this.form) {
      this.initForm();
    }
  }

  loadRestaurantData(): void {
    if (!this.restaurantId) {
      this.toastrsService.Showerror('Restaurant ID is missing');
      this.router.navigate(['/restaurants']);
      return;
    }

    this.isSaving$.next(true);

    this.httpService.listGet(this.api.restaurants.details(this.restaurantId), 'loadRestaurant').subscribe({
      next: (response: any) => {
        this.isSaving$.next(false);

        if (response?.status || response?.success) {
          const restaurant = response?.items || response?.data || response?.restaurant;

          if (restaurant) {
            this.populateFormWithRestaurantData(restaurant);
          } else {
            this.toastrsService.Showerror('Restaurant data not found');
            this.router.navigate(['/restaurants']);
          }
        } else {
          this.toastrsService.Showerror(response?.message || response?.msg || 'Failed to load restaurant data');
          this.router.navigate(['/restaurants']);
        }
      },
      error: (error: any) => {
        this.isSaving$.next(false);
        console.error('Load restaurant error:', error);

        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Failed to load restaurant data';
        this.toastrsService.Showerror(errorMessage);
        this.router.navigate(['/restaurants']);
      }
    });
  }

  private populateFormWithRestaurantData(restaurant: any): void {
    // Set flag to indicate we're in initial population phase
    this.isInitialPopulation = true;

    // Basic information
    this.form.patchValue({
      name: restaurant.name || '',
      description: restaurant.description || '',
      category: this.extractIds(restaurant.categories || restaurant.category || []),

      // Location
      address1: restaurant.address || '',
      address2: restaurant.address_line_2 || restaurant.address2 || '',
      city: restaurant.city_id || restaurant.city?.id || '',
      state: restaurant.state_id || restaurant.state?.id || '',
      country: restaurant.country_id || restaurant.country?.id || '',
      zipCode: restaurant.zip_postal_code || restaurant.zipCode || '',
      mapsUrl: restaurant.google_maps_url || restaurant.mapsUrl || '',
      latitude: restaurant.latitude ? parseFloat(restaurant.latitude) : null,
      longitude: restaurant.longitude ? parseFloat(restaurant.longitude) : null,

      // Contact
      phone: restaurant.phone_number || restaurant.phone || '',
      email: restaurant.email || '',
      website: restaurant.website_url || restaurant.website || '',
      facebook: restaurant.facebook_url || restaurant.facebook || '',
      instagram: restaurant.instagram_url || restaurant.instagram || '',
      twitter: restaurant.twitter_url || restaurant.twitter || '',

      // Admin - Don't populate admin fields in edit mode for security
      adminName: restaurant.admins?.[0]?.name || '',
      adminUserName: restaurant.admins?.[0]?.username || '',
      adminPhone: restaurant.admins?.[0]?.phone || '',
      adminEmail: restaurant.admins?.[0]?.email || '',
      
      // Note: Don't populate password fields for security

      // Delivery settings
      delivery_time: restaurant.delivery_time || 30,
      delivery_fee: restaurant.delivery_fee || 0,
      min_order_free_delivery: restaurant.min_order_free_delivery || 0,
      min_order: restaurant.min_order || 0,
      delivery_radius: restaurant.delivery_radius ? parseFloat(restaurant.delivery_radius) : 10,
      avg_meals_preparation_time: restaurant.avg_meals_preparation_time || 20,
      takeaway_preparation_time: restaurant.takeaway_preparation_time || 15,

      // Services - convert to numeric values (1 or 0)
      offersDelivery: restaurant.is_delivery === 1 || restaurant.is_delivery === true || restaurant.is_delivery === '1' ? 1 : 0,
      dineIn: restaurant.is_dine_in === 1 || restaurant.is_dine_in === true || restaurant.is_dine_in === '1' ? 1 : 0,
      takeaway: restaurant.is_takeaway === 1 || restaurant.is_takeaway === true || restaurant.is_takeaway === '1' ? 1 : 0,
      commissionRate: restaurant.commission_system_rate ? parseFloat(restaurant.commission_system_rate) : 0,
      tax_rate: restaurant.tax_rate ? parseFloat(restaurant.tax_rate) : 0,
      service_charge: restaurant.service_charge ? parseFloat(restaurant.service_charge) : 0,
      accountId: restaurant.account_payment_details || restaurant.accountId || '',

      // Tags and features
      cuisineTags: this.extractIds(restaurant.tags || restaurant.cuisineTags || []),
      specialFeatures: this.extractIds(restaurant.features || restaurant.specialFeatures || []),

      // Printer
      ip_printer: restaurant.ip_printer || ''
    });

    // Handle main image
    if (restaurant.image) {
      this.imagePreview = restaurant.image;
      // Note: We can't set a File object from URL, so image field stays null
      // The backend should handle updating without requiring a new image
    }

    // Handle gallery images
    if (restaurant.galleries && Array.isArray(restaurant.galleries)) {
      this.galleryPreviews = restaurant.galleries.map((gallery: any) => ({
        url: gallery.image,
        preview: gallery.image
      }));
      this.updateGalleryFormControl();
    } else if (restaurant.gallery_images && Array.isArray(restaurant.gallery_images)) {
      this.galleryPreviews = restaurant.gallery_images.map((imageUrl: string) => ({
        url: imageUrl,
        preview: imageUrl
      }));
      this.updateGalleryFormControl();
    }

    // Handle operating days/schedule_times
    const scheduleData = restaurant.schedule_times || restaurant.operating_days || [];
    if (scheduleData && Array.isArray(scheduleData)) {
      scheduleData.forEach((schedule: any) => {
        const dayKey = this.mapDayName(schedule.day);
        const dayGroup = this.operatingDaysArray.controls.find(
          day => day.get('key')?.value === dayKey
        ) as FormGroup;

        if (dayGroup) {
          dayGroup.patchValue({
            enabled: true,
            open: schedule.time_from ? schedule.time_from.substring(0, 5) : '', // HH:MM format
            close: schedule.time_to ? schedule.time_to.substring(0, 5) : '' // HH:MM format
          });
        }
      });
    }

    // Update map center if coordinates are available
    if (restaurant.latitude && restaurant.longitude) {
      this.center = {
        lat: parseFloat(restaurant.latitude),
        lng: parseFloat(restaurant.longitude)
      };
    }

    // Trigger country/state changes to load dependent dropdowns
    if (restaurant.country_id || restaurant.country?.id) {
      const countryId = restaurant.country_id || restaurant.country.id;
      const stateId = restaurant.state_id || restaurant.state.id;
      const cityId = restaurant.city_id || restaurant.city.id;

      setTimeout(() => {
        this.onCountryChange(countryId);

        if (stateId) {
          setTimeout(() => {
            this.onStateChange(stateId);

            // After loading states and cities, ensure the correct city is selected
            if (cityId) {
              setTimeout(() => {
                // Double-check that the city value is set correctly
                if (this.cities.find(c => c.id == cityId)) {
                  this.form.patchValue({ city: cityId });
                }
              }, 100);
            }

            // Reset the initial population flag after dropdowns are populated
            setTimeout(() => {
              this.isInitialPopulation = false;
            }, 200);
          }, 200);
        } else {
          // Reset the initial population flag if no state
          setTimeout(() => {
            this.isInitialPopulation = false;
          }, 100);
        }
      }, 100);
    } else {
      // Reset the initial population flag if no country
      this.isInitialPopulation = false;
    }

    // Re-apply conditional controls after patching
    this.setupConditionalControls();
  }

  private mapDayName(apiDayName: string): string {
    // Map API day names to our form keys
    const dayMapping: { [key: string]: string } = {
      'Monday': 'mon',
      'Tuesday': 'tue',
      'Wednesday': 'wed',
      'Thursday': 'thu',
      'Friday': 'fri',
      'Saturday': 'sat',
      'Sunday': 'sun'
    };

    return dayMapping[apiDayName] || apiDayName.toLowerCase().substring(0, 3);
  }

  private extractIds(items: any[]): any[] {
    if (!Array.isArray(items)) return [];

    return items.map(item => {
      if (typeof item === 'object' && item.id) {
        return item.id;
      }
      return item;
    });
  }

  onCountryChange(countryId: any): void {
    if (!countryId) {
      // Reset states and cities when country is cleared
      this.states = [];
      this.cities = [];
      this.form.patchValue({
        state: '',
        city: ''
      });
      return;
    }

    const selectedCountry = this.countries.find(c => c.id == countryId);

    if (selectedCountry && selectedCountry.states) {
      // Store current form values if we're in initial population
      const currentStateId = this.form.get('state')?.value;
      const currentCityId = this.form.get('city')?.value;

      // Update states list
      this.states = selectedCountry.states.map((state: any) => ({
        id: state.id,
        name: state.name,
        cities: state.cities || []
      }));

      // Always clear cities when country changes
      this.cities = [];

      // Clear form values if not in initial population OR if the current state doesn't exist in new states
      if (!this.isInitialPopulation) {
        this.form.patchValue({
          state: '',
          city: ''
        });
      } else {
        // In initial population, check if current state exists in new states list
        const stateExists = this.states.find(s => s.id == currentStateId);
        if (stateExists && currentStateId) {
          setTimeout(() => {
            this.onStateChange(currentStateId);
          }, 50);
        } else {
          // State doesn't exist in new country, clear it
          this.form.patchValue({
            state: '',
            city: ''
          });
        }
      }
    } else {
      // No states available for this country
      this.states = [];
      this.cities = [];
      this.form.patchValue({
        state: '',
        city: ''
      });
    }
  }

  onStateChange(stateId: any): void {
    if (!stateId) {
      // Reset cities when state is cleared
      this.cities = [];
      this.form.patchValue({
        city: ''
      });
      return;
    }

    const selectedState = this.states.find(s => s.id == stateId);

    if (selectedState && selectedState.cities) {
      // Store current city value if we're in initial population
      const currentCityId = this.form.get('city')?.value;

      // Update cities list
      this.cities = selectedState.cities.map((city: any) => ({
        id: city.id,
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude
      }));

      // In initial population mode, preserve city if it exists in new cities list
      if (this.isInitialPopulation && currentCityId) {
        const cityExists = this.cities.find(c => c.id == currentCityId);
        if (!cityExists) {
          // City doesn't exist in new state, clear it
          this.form.patchValue({
            city: ''
          });
        }
        // If city exists, don't clear it - it should remain selected
      } else if (!this.isInitialPopulation) {
        // Not in initial population, clear city selection
        this.form.patchValue({
          city: ''
        });
      }
    } else {
      // No cities available for this state
      this.cities = [];
      this.form.patchValue({
        city: ''
      });
    }
  }

  // Tracking functions for performance optimization
  trackByCountryId(index: number, country: any): number {
    return country.id;
  }

  trackByStateId(index: number, state: any): number {
    return state.id;
  }

  trackByCityId(index: number, city: any): number {
    return city.id;
  }

  trackByCategoryId(index: number, category: any): number {
    return category.id;
  }

  trackByFeatureId(index: number, feature: any): number {
    return feature.id;
  }

  trackByTagId(index: number, tag: any): number {
    return tag.id;
  }

  // Helper methods for UI state
  get hasCountries(): boolean {
    return this.countries && this.countries.length > 0;
  }

  get hasStates(): boolean {
    return this.states && this.states.length > 0;
  }

  get hasCities(): boolean {
    return this.cities && this.cities.length > 0;
  }

  get hasCategories(): boolean {
    return this.categories && this.categories.length > 0;
  }

  get hasCuisineTags(): boolean {
    return this.cuisineTagsList && this.cuisineTagsList.length > 0;
  }

  get hasSpecialFeatures(): boolean {
    return this.specialFeaturesList && this.specialFeaturesList.length > 0;
  }

  get isFormReady(): boolean {
    return !this.isLoadingLookups$.value && this.form !== undefined;
  }

  private mapDayKeyToFullName(dayKey: string): string {
    // Map our form day keys to full day names that the API expects
    const dayMapping: { [key: string]: string } = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    };

    return dayMapping[dayKey] || dayKey;
  }

}
