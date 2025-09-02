import { Component, Input } from '@angular/core';

export interface BookItem {
  id?: number;
  img: string;
  title: string;
  author?: string;
  price?: string;
  rating?: number;
  alt?: string;
}

@Component({
  selector: 'app-bestselling',
  templateUrl: './bestselling.component.html',
  styleUrls: ['./bestselling.component.css']
})
export class BestsellingComponent {
  @Input() title: string = 'Bestselling Books';
  @Input() items: BookItem[] = [];
}
