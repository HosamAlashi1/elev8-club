import { Component } from '@angular/core';

interface Author {
  name: string;
  book: string;
  description: string;
  image: string;
  link?: string;   // الرابط
  reverse?: boolean;
}

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.css']
})
export class AuthorsComponent {
  title = 'Featured Authors';
  subtitle = 'Discover Our Most Notable Writers';

  authors: Author[] = [
    {
      name: 'Elizabeth Morgan',
      book: 'The Silent Garden',
      description: `Award-winning novelist Elizabeth Morgan brings forth a compelling tale of mystery and intrigue set in the lush gardens of Victorian England. Her masterful storytelling has earned her critical acclaim worldwide.`,
      image: 'assets/img/landing/featured-author/author1.png',
      link: '' // حاليًا فاضي
    },
    {
      name: 'James Harrison',
      book: 'Quantum Horizons',
      description: `Bestselling science fiction author James Harrison explores the boundaries of human consciousness in his groundbreaking new novel. A perfect blend of scientific accuracy and imaginative storytelling.`,
      image: 'assets/img/landing/featured-author/author2.png',
      reverse: true,
      link: '' // حاليًا فاضي
    },
    {
      name: 'Sarah Chen',
      book: 'The Paper Lantern',
      description: `Drawing from her rich cultural heritage, Sarah Chen weaves a beautiful narrative of family, tradition, and modern life in her debut novel that has captured readers’ hearts globally.`,
      image: 'assets/img/landing/featured-author/author3.png',
      link: '' // حاليًا فاضي
    }
  ];
}
