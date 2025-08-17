import { Component, OnInit, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  isLoading$: any;
  isArabic = localStorage.getItem('lang') === 'ar';

  settingsTypes: any[] = [];
  settings: any = {};
  formValues: { [key: string]: any } = {};
  imagePreviews: { [key: string]: string } = {};
  showBackToTop: boolean = false;

  constructor(
    private api: ApiService,
    public httpService: HttpService,
    private toastr: ToastrsService
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.httpService.getLoading('settingsList');
    this.loadSettings();
    this.checkScrollPosition();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkScrollPosition();
  }

  checkScrollPosition(): void {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showBackToTop = scrollPosition > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  loadSettings(): void {
    this.httpService.list(this.api.settings.list, {}, 'settingsList').subscribe({
      next: (res) => {
        if (res?.status) {
          this.settingsTypes = res.data.settings_types;
          this.settings = res.data.settings;

          // initialize form values
          this.settingsTypes.forEach((type) => {
            const group = this.settings[type.type];
            for (let key in group) {
              this.formValues[key] = group[key].value;
              // Set initial image previews for existing images
              if (key.includes('image') && group[key].value) {
                this.imagePreviews[key] = group[key].value;
              }
            }
          });
        }
      },
      error: () => {
        this.toastr.Showerror('Failed to load settings');
      },
    });
  }

  getSettingKeys(type: string): string[] {
    return Object.keys(this.settings[type] || {});
  }

  getFieldColClass(key: string, sectionType: string): string {
    const sectionKeys = this.getSettingKeys(sectionType);
    const fieldCount = sectionKeys.length;
    
    // Calculate responsive column class based on number of fields
    let colClass = '';
    
    if (fieldCount === 1) {
      colClass = 'col-12 col-md-12';  // Full width for single field
    } else if (fieldCount === 2) {
      colClass = 'col-12 col-md-6';   // Half width for two fields on desktop, full on mobile
    } else if (fieldCount === 3) {
      colClass = 'col-12 col-sm-6 col-md-4';   // Responsive: full on xs, half on sm, third on md+
    } else if (fieldCount <= 6) {
      colClass = 'col-12 col-sm-6 col-md-4';   // Same as above for 4-6 fields
    } else {
      colClass = 'col-12 col-sm-6 col-md-3';   // Quarter width on desktop, half on tablet, full on mobile
    }
    
    return colClass;
  }

  getSectionIcon(sectionType: string): string {
    const iconMap: { [key: string]: string } = {
      'General Settings': 'settings',
      'Hero Section Settings': 'home',
      'Solution Section Settings': 'lightbulb',
      'Process Section Settings': 'workflow',
      'Features Section Settings': 'layers',
      'App Preview Section Settings': 'monitor-smartphone',
      'Testimonial Section Settings': 'message-square',
      'Get Started Section Settings': 'play-circle',
      'Contact Us Section Settings': 'phone',
      'Footer Section Settings': 'layout'
    };
    
    return iconMap[sectionType] || 'folder';
  }

  getSectionColor(sectionType: string): string {
    const colorMap: { [key: string]: string } = {
      'General Settings': 'primary',
      'Hero Section Settings': 'success',
      'Solution Section Settings': 'warning',
      'Process Section Settings': 'info',
      'Features Section Settings': 'secondary',
      'App Preview Section Settings': 'dark',
      'Testimonial Section Settings': 'danger',
      'Get Started Section Settings': 'success',
      'Contact Us Section Settings': 'info',
      'Footer Section Settings': 'secondary'
    };
    
    return colorMap[sectionType] || 'primary';
  }

  getSectionDescription(sectionType: string): string {
    const descMap: { [key: string]: string } = {
      'General Settings': 'Basic website information, contact details, and social media links',
      'Hero Section Settings': 'Main banner content, titles, and call-to-action buttons',
      'Solution Section Settings': 'Product/service solution presentation and features list',
      'Process Section Settings': 'Step-by-step process or workflow configuration',
      'Features Section Settings': 'Product features and capabilities showcase',
      'App Preview Section Settings': 'Mobile application screenshots and previews',
      'Testimonial Section Settings': 'Customer reviews and testimonials display',
      'Get Started Section Settings': 'Getting started section with QR codes and links',
      'Contact Us Section Settings': 'Contact form and communication preferences',
      'Footer Section Settings': 'Footer content, links, and additional information'
    };
    
    return descMap[sectionType] || 'Settings configuration for this section';
  }



  onFileChange(event: any, key: string): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.formValues[key] = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews[key] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submit(): void {
    const formData = new FormData();
    for (let key in this.formValues) {
      const value = this.formValues[key];

      if (key.includes('image')) {
        if (value instanceof File) {
          formData.append(key, value);
        }
      } else {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      }
    }
    this.httpService.action(this.api.settings.update, formData, 'settingsUpdate').subscribe({
      next: (res) => {
        if (res?.status) {
          this.toastr.Showsuccess('Settings updated successfully');
          this.loadSettings();
        } else {
          this.toastr.Showerror(res?.message || 'Update failed');
        }
      },
      error: () => {
        this.toastr.Showerror('Update failed');
      },
    });
  }
}
