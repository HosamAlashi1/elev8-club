import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface FlowItem {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'p' | 'img';
  chapterId?: number;
  text?: string;
  src?: string;
  alt?: string;
  voice_url?: string;
}

export interface Chapter {
  id: number;
  title: string;
}

export interface BookSettings {
  page: { width: number; height: number; padding: number; gutter: number };
  typography: { font: string; size: number; lineHeight: number };
  theme: 'light' | 'sepia' | 'dark';
  spread: boolean;
  rtl: boolean;
}

export interface BookSounds {
  drag: string;
  flip: string;
  enabled: boolean;
  volume: number;
}

export interface Book {
  id: number;
  title: string;
  cover_url?: string;
  language: string;
  default_voice_key?: string;
  settings: BookSettings;
  sounds: BookSounds;
}

export interface BookData {
  book: Book;
  chapters: Chapter[];
  flow: FlowItem[];
}

@Injectable({ providedIn: 'root' })
export class MockReaderApiService {

  constructor(private http: HttpClient) {}

  /**
   * Get complete book data (book + chapters + flow)
   */
  getBookData(bookId: number): Observable<BookData> {
    return this.http.get<BookData>(`assets/mock/book-22.json`).pipe(
      catchError(error => {
        console.error('Failed to load book data:', error);
        // Return fallback mock data
        return of(this.getFallbackData(bookId));
      })
    );
  }

  /**
   * Get book metadata only
   */
  getBook(bookId: number): Observable<Book> {
    return this.getBookData(bookId).pipe(
      map(data => data.book)
    );
  }

  /**
   * Get chapters list
   */
  getChapters(bookId: number): Observable<Chapter[]> {
    return this.getBookData(bookId).pipe(
      map(data => data.chapters)
    );
  }

  /**
   * Get flow (all content)
   */
  getFlow(bookId: number): Observable<FlowItem[]> {
    return this.getBookData(bookId).pipe(
      map(data => data.flow)
    );
  }

  /**
   * Fallback data when JSON file doesn't exist
   */
  private getFallbackData(bookId: number): BookData {
    return {
      book: {
        id: bookId,
        title: 'Sample Book',
        language: 'en',
        settings: {
          page: { width: 820, height: 600, padding: 20, gutter: 24 },
          typography: { font: 'Georgia, serif', size: 16, lineHeight: 1.65 },
          theme: 'light',
          spread: true,
          rtl: false
        },
        sounds: {
          drag: 'assets/sfx/page-drag.mp3',
          flip: 'assets/sfx/page-flip.mp3',
          enabled: true,
          volume: 0.35
        }
      },
      chapters: [
        { id: 1, title: 'Chapter 1' }
      ],
      flow: [
        { id: 'h1', type: 'h1', text: 'Sample Book' },
        { id: 'c1', type: 'h2', chapterId: 1, text: 'Chapter 1' },
        { id: 'p1', type: 'p', chapterId: 1, text: 'This is a sample book. Add your JSON file at src/assets/mock/book-${bookId}.json to load custom content.' },
        { id: 'p2', type: 'p', chapterId: 1, text: 'The reader will automatically paginate your content based on available space. You can customize font size, line height, and theme in the settings panel.' }
      ]
    };
  }
}
