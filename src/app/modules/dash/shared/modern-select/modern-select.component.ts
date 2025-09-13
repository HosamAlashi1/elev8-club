import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ModernSelectService } from './modern-select.service';
import { Subscription } from 'rxjs';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-modern-select',
  templateUrl: './modern-select.component.html',
  styleUrls: ['./modern-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ModernSelectComponent),
      multi: true
    }
  ],
  animations: [
    trigger('dropdownAnimation', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
        visibility: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        visibility: 'visible'
      })),
      transition('closed => open', [
        style({ visibility: 'visible' }),
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('open => closed', [
        animate('150ms cubic-bezier(0.25, 0.8, 0.25, 1)'),
        style({ visibility: 'hidden' })
      ])
    ]),
    trigger('chevronAnimation', [
      state('closed', style({
        transform: 'rotate(0deg)'
      })),
      state('open', style({
        transform: 'rotate(180deg)'
      })),
      transition('closed <=> open', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ])
    ])
  ]
})
export class ModernSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder2: string = 'Select an option';
  @Input() icon?: string; // جعل الأيقونة اختيارية
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';
  @Input() disabled: boolean = false;
  @Input() clearable: boolean = false;
  @Input() searchable: boolean = false;
  @Input() minWidth: string = '160px';
  
  // خصائص التخصيص الجديدة
  @Input() customWidth?: string;
  @Input() backgroundColor?: string = '#EFEFEF'; // الخلفية الافتراضية
  @Input() textColor?: string = '#64748B'; // لون النص الافتراضي
  @Input() borderColor?: string = '#d1d5db'; // لون الحد الافتراضي
  @Input() hoverBorderColor?: string = '#adb5bd'; // لون الحد عند الـ hover
  @Input() focusBorderColor?: string = '#6c757d'; // لون الحد عند الـ focus

  @Output() selectionChange = new EventEmitter<any>();

  isOpen = false;
  selectedValue: any = null;
  selectedOption: SelectOption | null = null;
  searchTerm = '';
  filteredOptions: SelectOption[] = [];
  
  // معرف فريد لكل instance
  private componentId: string;
  private closeAllSubscription: Subscription;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private modernSelectService: ModernSelectService) {
    // إنشاء معرف فريد لكل كومبوننت
    this.componentId = 'modern-select-' + Math.random().toString(36).substr(2, 9);
  }

  ngOnInit() {
    this.filteredOptions = [...this.options];
    
    // الاشتراك في خدمة إغلاق جميع الـ selects
    this.closeAllSubscription = this.modernSelectService.closeAll$.subscribe((excludeId: string) => {
      // إذا كان الـ ID المستثنى مختلف عن ID هذا الكومبوننت، أغلق الـ dropdown
      if (excludeId !== this.componentId && this.isOpen) {
        this.isOpen = false;
      }
    });
  }
  
  ngOnDestroy() {
    // إلغاء الاشتراك لتجنب memory leaks
    if (this.closeAllSubscription) {
      this.closeAllSubscription.unsubscribe();
    }
  }

  get dropdownState() {
    return this.isOpen ? 'open' : 'closed';
  }

  get selectedLabel(): string {
    return this.selectedOption?.label || this.placeholder2;
  }

  get hasSelection(): boolean {
    return this.selectedValue !== null && 
           this.selectedValue !== undefined && 
           this.selectedValue !== '';
  }

  // دالة للتحقق من وجود قيمة حقيقية (ليس "All" أو أول خيار)
  get hasRealValue(): boolean {
    if (!this.hasSelection || !this.selectedOption?.label) {
      return false;
    }
    
    const label = this.selectedOption.label.toLowerCase();
    // التحقق من أن الخيار ليس "الكل" أو "جميع" أو "All" أو القيمة الفارغة
    return this.selectedValue !== '' && 
           !label.includes('الكل') && 
           !label.includes('جميع') && 
           !label.startsWith('all') &&
           !label.startsWith('كل');
  }

  // دالة للتحقق من وجود أيقونة
  get hasIcon(): boolean {
    return !!this.icon;
  }

  // دالة للتحقق من أن الخيار له قيمة حقيقية
  isRealValueOption(option: SelectOption): boolean {
    if (!option || option.value === '' || option.value === null || option.value === undefined) {
      return false;
    }
    
    const label = option.label.toLowerCase();
    return !label.includes('الكل') && 
           !label.includes('جميع') && 
           !label.startsWith('all') &&
           !label.startsWith('كل');
  }

  // دالة للحصول على الستايلات المخصصة
  get customStyles(): any {
    return {
      '--select-bg-color': this.backgroundColor,
      '--select-text-color': this.textColor,
      '--select-border-color': this.borderColor,
      '--hover-border-color': this.hoverBorderColor,
      '--focus-border-color': this.focusBorderColor,
      'width': this.customWidth || 'auto'
    };
  }

  toggleDropdown(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (this.disabled) return;
    
    // إذا كان سيفتح، أغلق جميع الـ selects الأخرى أولاً
    if (!this.isOpen) {
      this.modernSelectService.closeAllExcept(this.componentId);
    }
    
    this.isOpen = !this.isOpen;
    this.onTouched();
    
    if (this.isOpen) {
      this.searchTerm = '';
      this.filteredOptions = [...this.options];
      
      // Focus search input if searchable
      setTimeout(() => {
        if (this.searchable) {
          const searchInput = document.querySelector('.modern-select-search') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      }, 100);
    }
  }

  selectOption(option: SelectOption, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (option.disabled) return;
    
    this.selectedValue = option.value;
    this.selectedOption = option;
    this.isOpen = false;
    
    this.onChange(this.selectedValue);
    this.selectionChange.emit(this.selectedValue);
  }

  clearSelection(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.selectedValue = null;
    this.selectedOption = null;
    
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  onSearchChange() {
    if (!this.searchTerm.trim()) {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter(option =>
        option.label.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    
    // البحث عن الـ container الخاص بهذا الكومبوننت تحديداً
    const allSelectContainers = document.querySelectorAll('.modern-select-container');
    let clickedInsideAnySelect = false;
    
    allSelectContainers.forEach(container => {
      if (container.contains(target)) {
        clickedInsideAnySelect = true;
      }
    });
    
    // إذا ما انضغط جوا أي select، أغلق الكل
    if (!clickedInsideAnySelect) {
      this.modernSelectService.closeAll();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.selectedValue = value;
    this.selectedOption = this.options.find(option => option.value === value) || null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
