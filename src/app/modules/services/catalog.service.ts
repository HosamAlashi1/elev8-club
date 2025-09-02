import { Injectable } from '@angular/core';

export interface BookReview {
  reviewer: string;
  rating: number;
  text: string;
  avatar?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  reviewsCount: number;
  description: string;
  isbn: string;
  published: number;
  pages: number;
  images: string[];
  reviews: BookReview[];
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private books: Book[] = [
    {
      id: 'book1',
      title: 'The Art of Storytelling',
      author: 'Sarah Johnson',
      price: 24.99,
      rating: 4.8,
      reviewsCount: 128,
      description: `A comprehensive guide to mastering the art of storytelling. 
        Learn the techniques, principles, and practices that will help you 
        create compelling narratives that captivate your audience.`,
      isbn: '978-1-48089-876-7',
      published: 2018,
      pages: 64,
      images: [
        'assets/img/landing/book-details/book1.png',
        'assets/img/landing/book-details/book2.png',
        'assets/img/landing/book-details/book3.png',
        'assets/img/landing/book-details/book4.png'
      ],
      reviews: [
        {
          reviewer: 'John Doe',
          rating: 5,
          text: 'Excellent book! The storytelling techniques are practical and easy to implement.',
          avatar: ''
        },
        {
          reviewer: 'Jane Smith',
          rating: 4,
          text: 'Very insightful. Helped me improve my presentations significantly.',
          avatar: ''
        }
      ]
    },
    {
      id: 'book2',
      title: 'Future of AI',
      author: 'John King',
      price: 32.99,
      rating: 4.5,
      reviewsCount: 85,
      description: `An exploration into artificial intelligence and its impact on our future.
        Covering breakthroughs, ethical dilemmas, and how AI is shaping industries.`,
      isbn: '978-1-48089-123-4',
      published: 2020,
      pages: 220,
      images: [
        'assets/img/landing/book-details/book1.png',
        'assets/img/landing/book-details/book2.png',
        'assets/img/landing/book-details/book3.png',
      ],
      reviews: [
        {
          reviewer: 'Michael Carter',
          rating: 5,
          text: 'This book changed the way I think about technology and the future.',
          avatar: ''
        },
        {
          reviewer: 'Laura Chen',
          rating: 4,
          text: 'Great overview of AI, though I wished it went deeper in some areas.',
          avatar: ''
        }
      ]
    },
    {
      id: 'book3',
      title: 'Mountain Dreams',
      author: 'Emily Parker',
      price: 19.95,
      rating: 4.2,
      reviewsCount: 64,
      description: `A heartwarming tale set in the mountains, blending adventure with 
        deep emotional connections and a journey of self-discovery.`,
      isbn: '978-1-48089-543-9',
      published: 2016,
      pages: 310,
      images: [
        'assets/img/landing/book-details/book1.png',
        'assets/img/landing/book-details/book2.png',
        'assets/img/landing/book-details/book3.png',
      ],
      reviews: [
        {
          reviewer: 'Sam Wilson',
          rating: 4,
          text: 'A touching story with beautiful descriptions of nature.',
          avatar: ''
        },
        {
          reviewer: 'Clara Roberts',
          rating: 5,
          text: 'Could not put it down. The characters felt real and inspiring.',
          avatar: ''
        }
      ]
    },
    {
      id: 'book4',
      title: 'Urban Tales',
      author: 'David Miller',
      price: 24.50,
      rating: 4.0,
      reviewsCount: 47,
      description: `Stories from the bustling streets of the city. 
        A collection of modern short stories that reflect the rhythm of urban life.`,
      isbn: '978-1-48089-667-2',
      published: 2019,
      pages: 180,
      images: [
        'assets/img/landing/book-details/book1.png',
        'assets/img/landing/book-details/book2.png',
        'assets/img/landing/book-details/book3.png',
      ],
      reviews: [
        {
          reviewer: 'Olivia Brown',
          rating: 4,
          text: 'Interesting stories, though a bit uneven in pacing.',
          avatar: ''
        },
        {
          reviewer: 'Kevin Lopez',
          rating: 5,
          text: 'Loved the raw and authentic feel of the writing!',
          avatar: ''
        }
      ]
    }
  ];

  getAllBooks(): Book[] {
    return this.books;
  }

  getBookById(id: string): Book | undefined {
    return this.books.find(b => b.id === id);
  }
}
