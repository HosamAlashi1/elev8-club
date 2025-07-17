import { Component, Input, HostListener, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DropdownService } from '../../services/dropdown.service';

interface GObject {
  id: number;
  name: string;
  full_name: string;
  image: string;
}

@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ]
})
export class MultiSelectComponent implements ControlValueAccessor, OnChanges {

  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() uniqueId: string = 'dropdown';
  @Input() options: GObject[] = [];
  @Input() selectedOptions: GObject[] = [];

  searchQuery = '';
  selectedItems: GObject[] = [];
  isDropdownOpen = false;

  private onChange: (value: GObject[]) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(private dropdownService: DropdownService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOptions'] || changes['options']) {
      this.updateSelectedItems();
    }
  }

  ngOnInit() {
    this.dropdownService.getActiveDropdown().subscribe((activeId) => {
      this.isDropdownOpen = activeId === this.uniqueId;
    });
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(`.dropdown-${this.uniqueId}`)) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown() {
    const newState = !this.isDropdownOpen;
    this.isDropdownOpen = newState;

    if (newState) {
      this.dropdownService.setActiveDropdown(this.uniqueId);
    } else {
      this.dropdownService.setActiveDropdown(null);
    }

    this.sortOptionsBySelection();
  }

  toggleSelection(item: GObject) {
    const index = this.selectedItems.findIndex(selected => selected.id === item.id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item);
    }
    this.onChange(this.selectedItems);
    this.onTouched();
  }

  removeItem(item: GObject) {
    this.selectedItems = this.selectedItems.filter(selected => selected.id !== item.id);
    this.onChange(this.selectedItems);
    this.onTouched();
  }

  isSelected(itemId: number): boolean {
    return this.selectedItems.some(selected => selected.id === itemId);
  }

  filterOptions(): GObject[] {
    return this.options ? this.options.filter(option => {
      const target = option?.name || option?.full_name || '';
      return target.toLowerCase().includes(this.searchQuery.toLowerCase());
    }) : [];
  }

  sortOptionsBySelection() {
    this.options = [
      ...this.options.filter(option => this.selectedItems.some(selected => selected.id === option.id)),
      ...this.options.filter(option => !this.selectedItems.some(selected => selected.id === option.id))
    ];
  }

  writeValue(value: GObject[]): void {
    this.selectedOptions = value || [];
    this.updateSelectedItems();
  }

  registerOnChange(fn: (value: GObject[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  handleDropdownClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  private updateSelectedItems(): void {
    if (this.options && this.selectedOptions?.length) {
      this.selectedItems = this.options.filter(option =>
        this.selectedOptions.some(selected =>
          typeof selected === 'object' && 'id' in selected
            ? selected.id === option.id
            : selected === option.id
        )
      );
    } else {
      this.selectedItems = [];
    }
  }
}
