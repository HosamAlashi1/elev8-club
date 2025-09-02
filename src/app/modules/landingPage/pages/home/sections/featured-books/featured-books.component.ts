import { Component, Input } from '@angular/core';

export interface BookItem {
  img: string;
  title: string;
  author?: string;
  price?: string;
  rating?: number;
  alt?: string;
}

@Component({
  selector: 'app-featured-books',
  templateUrl: './featured-books.component.html',
  styleUrls: ['./featured-books.component.css']
})
export class FeaturedBooksComponent {
  @Input() title: string = 'Featured Books';
  @Input() items: BookItem[] = [];
}
