import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, HostListener, TemplateRef, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface SearchableOption {
  id: any;
  name?: string;
  title?: string;
  flag?: string;
  disabled?: boolean;
  [key: string]: any; // Allow dynamic property access
}

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  @Input() options: SearchableOption[] = [];
  @Input() placeholder: string = 'Search and select...';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() required: boolean = false;
  @Input() searchFields: string[] = ['name', 'title'];
  @Input() displayField: string = 'name';
  @Input() valueField: string = 'id';
  @Input() clearable: boolean = true;
  @Input() maxHeight: string = '200px';

  @Output() selectionChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>(); // إضافة event للبحث

  @ViewChild('selectButton') selectButton!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

  // Portal-related properties
  private dropdownPortal: EmbeddedViewRef<any> | null = null;
  dropdownStyles: any = {};

  searchQuery$ = new BehaviorSubject<string>('');
  filteredOptions: SearchableOption[] = [];
  selectedOption: SearchableOption | null = null;
  isOpen = false;
  highlightedIndex = -1;
  displayText = '';

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Watch for changes in options input
    if (changes['options']) {
      const currentOptions = changes['options'].currentValue;
      const previousOptions = changes['options'].previousValue;
      
      // If options changed and we have new options
      if (currentOptions && (!previousOptions || currentOptions !== previousOptions)) {
        // Apply initial filter to show all options when no search query
        this.filterOptions(this.searchQuery$.value || '');
        
        // Check if current selection is still valid with new options
        if (this.selectedOption) {
          const stillExists = currentOptions.find((opt: any) => opt[this.valueField] == this.selectedOption![this.valueField]);
          if (stillExists) {
            // Update display text in case the option details changed
            this.displayText = this.getDisplayText(stillExists);
            this.selectedOption = stillExists;
          } else {
            // Selected option no longer exists in new options, clear selection
            this.selectedOption = null;
            this.displayText = '';
            // Notify parent about the change
            this.onChange(null);
            this.selectionChange.emit(null);
          }
        } else {
          // No current selection, check if options were loaded after form value was set
          // This handles the case where options load after the form value is set
          setTimeout(() => {
            // The parent component's form control will trigger writeValue again
            // if there's a pending value that now has corresponding options
          }, 10);
        }
      }
    }
  }

  ngOnInit(): void {
    // Setup search filtering with debounce
    this.searchQuery$
      .pipe(
        debounceTime(150),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.filterOptions(query);
        // إرسال event للبحث
        this.searchChange.emit(query);
      });

    // Initial filter - ensure filteredOptions are populated immediately
    this.initializeFilteredOptions();
  }

  private initializeFilteredOptions(): void {
    // If we already have options, filter them immediately
    if (this.options && this.options.length > 0) {
      this.filterOptions('');
    }
  }

  ngOnDestroy(): void {
    this.closeDropdown();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    // Wait for options to be available if value is provided but options are empty
    if (value !== undefined && value !== null && value !== '' && this.options.length === 0) {
      // Retry after a short delay to allow options to load
      setTimeout(() => {
        this.writeValue(value);
      }, 100);
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      const option = this.options.find(opt => opt[this.valueField] == value);
      if (option) {
        this.selectedOption = option;
        this.displayText = this.getDisplayText(option);
      } else {
        // Value exists but corresponding option not found in current options list
        // This can happen when parent component changes the options array
        // Clear the selection to avoid displaying stale data
        this.selectedOption = null;
        this.displayText = '';
      }
    } else {
      this.selectedOption = null;
      this.displayText = '';
    }
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

  // Component methods
  toggleDropdown(): void {
    if (this.disabled || this.loading) return;
    
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.openDropdown();
    } else {
      this.closeDropdown();
    }
    this.onTouched();
  }

  private openDropdown(): void {
    this.highlightedIndex = -1;
    this.createDropdownPortal();
    this.calculateDropdownPosition();
    
    // Add class to body to manage overflow if needed
    document.body.classList.add('dropdown-open');
    
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 100);
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.highlightedIndex = -1;
    this.searchQuery$.next('');
    this.destroyDropdownPortal();
    
    // Remove class from body
    document.body.classList.remove('dropdown-open');
  }

  private createDropdownPortal(): void {
    if (this.dropdownTemplate && !this.dropdownPortal) {
      this.dropdownPortal = this.viewContainerRef.createEmbeddedView(this.dropdownTemplate);
      
      // Append to body
      const dropdownElement = this.dropdownPortal.rootNodes[0];
      if (dropdownElement) {
        document.body.appendChild(dropdownElement);
      }
    }
  }

  private destroyDropdownPortal(): void {
    if (this.dropdownPortal) {
      // Remove from DOM
      const dropdownElement = this.dropdownPortal.rootNodes[0];
      if (dropdownElement && dropdownElement.parentNode) {
        dropdownElement.parentNode.removeChild(dropdownElement);
      }
      
      // Destroy the view
      this.dropdownPortal.destroy();
      this.dropdownPortal = null;
    }
  }

  private calculateDropdownPosition(): void {
    if (!this.selectButton?.nativeElement) return;

    const buttonRect = this.selectButton.nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 300; // Max height from CSS
    
    // Calculate if dropdown should open upward or downward
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    this.dropdownStyles = {
      position: 'fixed',
      top: openUpward ? `${buttonRect.top - dropdownHeight}px` : `${buttonRect.bottom + 2}px`,
      left: `${buttonRect.left}px`,
      width: `${buttonRect.width}px`,
      'z-index': '10000',
      'max-height': `${Math.min(dropdownHeight, openUpward ? spaceAbove - 10 : spaceBelow - 10)}px`
    };
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery$.next(target.value);
    this.highlightedIndex = -1;
  }

  onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightPrevious();
        break;
      case 'Enter':
        event.preventDefault();
        this.selectHighlighted();
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  selectOption(option: SearchableOption): void {
    if (option.disabled) return;

    this.selectedOption = option;
    this.displayText = this.getDisplayText(option);
    this.onChange(option[this.valueField]);
    this.selectionChange.emit(option);
    this.closeDropdown();
  }

  clearSelection(): void {
    if (this.disabled) return;
    
    this.selectedOption = null;
    this.displayText = '';
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  private filterOptions(query: string): void {
    if (!query.trim()) {
      this.filteredOptions = [...this.options];
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    this.filteredOptions = this.options.filter(option => {
      return this.searchFields.some(field => {
        const fieldValue = option[field];
        return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm);
      });
    });
  }

  private highlightNext(): void {
    if (this.filteredOptions.length === 0) return;
    
    this.highlightedIndex = this.highlightedIndex < this.filteredOptions.length - 1 
      ? this.highlightedIndex + 1 
      : 0;
    this.scrollToHighlighted();
  }

  private highlightPrevious(): void {
    if (this.filteredOptions.length === 0) return;
    
    this.highlightedIndex = this.highlightedIndex > 0 
      ? this.highlightedIndex - 1 
      : this.filteredOptions.length - 1;
    this.scrollToHighlighted();
  }

  private selectHighlighted(): void {
    if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
      this.selectOption(this.filteredOptions[this.highlightedIndex]);
    }
  }

  private scrollToHighlighted(): void {
    setTimeout(() => {
      // Find dropdown element in the portal
      const dropdownElement = this.dropdownPortal?.rootNodes[0];
      const highlightedElement = dropdownElement?.querySelector(`[data-index="${this.highlightedIndex}"]`) as HTMLElement;
      
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ 
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  private getDisplayText(option: SearchableOption): string {
    const text = option[this.displayField] || option.name || '';
    return text.toString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node;
    const dropdownElement = this.dropdownPortal?.rootNodes[0];
    
    // Check if click is outside both the select component and the dropdown portal
    if (!this.elementRef.nativeElement.contains(target) && 
        (!dropdownElement || !dropdownElement.contains(target))) {
      this.closeDropdown();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.calculateDropdownPosition();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen) {
      this.calculateDropdownPosition();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.closeDropdown();
    }
  }

  get hasResults(): boolean {
    return this.filteredOptions.length > 0;
  }

  get searchQuery(): string {
    return this.searchQuery$.value;
  }

  get isValid(): boolean {
    return !this.required || !!this.selectedOption;
  }

  trackByFn(index: number, option: SearchableOption): any {
    return option[this.valueField] || index;
  }
}
