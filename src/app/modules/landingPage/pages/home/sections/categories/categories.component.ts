import { Component, Input } from '@angular/core';

export interface CategoryItem {
  icon: string;
  title: string;
  count?: string;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent {
  @Input() title: string = 'Book Categories';
  @Input() items: CategoryItem[] = [];
}
