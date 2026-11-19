import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEAD_DATE_PRESETS, LeadDateFilter } from './lead-date-range';

@Component({
  selector: 'app-lead-date-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-controls">
      <label>
        <span>Created date</span>
        <select class="form-select form-select-sm" [ngModel]="filter.preset"
                (ngModelChange)="change({ preset: $event })">
          <option *ngFor="let option of presets" [value]="option.value">{{ option.label }}</option>
        </select>
      </label>
      <ng-container *ngIf="filter.preset === 'custom'">
        <label>
          <span>Date From</span>
          <input type="date" class="form-control form-control-sm" [ngModel]="filter.from"
                 [attr.max]="filter.to || null" (ngModelChange)="change({ from: $event })">
        </label>
        <label>
          <span>Date To</span>
          <input type="date" class="form-control form-control-sm" [ngModel]="filter.to"
                 [attr.min]="filter.from || null" (ngModelChange)="change({ to: $event })">
        </label>
      </ng-container>
    </div>
    <small class="range-error" role="alert" *ngIf="filter.preset === 'custom' && filter.to &&
                                                filter.from > filter.to">
      Date From must be on or before Date To.
    </small>
  `,
  styles: [`
    :host { display: block; }
    .date-controls { display: flex; flex-wrap: wrap; gap: 10px; }
    label { display: grid; gap: 4px; }
    label span { color: #aab2bb; font-size: .75rem; font-weight: 600; }
    select, input { color-scheme: dark; }
    .range-error { display: block; margin-top: 6px; color: #f3a0a5; }
  `],
})
export class LeadDateFilterComponent {
  @Input() filter: LeadDateFilter = { preset: 'all', from: '', to: '' };
  @Output() readonly filterChange = new EventEmitter<LeadDateFilter>();
  readonly presets = LEAD_DATE_PRESETS;

  change(update: Partial<LeadDateFilter>): void {
    this.filterChange.emit({ ...this.filter, ...update });
  }
}
