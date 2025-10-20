import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LandingAuthSessionService } from 'src/app/modules/services/auth-session.service';

// نوع المستخدم من الـ Backend
enum AuthType {
  Admin = 1,
  Author = 2,
  Editor = 3,
  Customer = 4
}

// نوع الكتاب
enum BookType {
  AUDIO = 'audio',
  EBOOK = 'ebook',
  HYBRID = 'hybrid'
}

// نوع الـ Variant
enum VariantType {
  EBook = 1,
  ABook = 2
}

// نموذج الكتاب
interface AudioBook {
  id: number;
  title: string;
  isbn: string;
  book_cover: string;
  variants: number[];
  project_id: number | null;
  type?: BookType;
  imageLoaded?: boolean;  // إضافة هذا
}

@Component({
  selector: 'app-my-books',
  templateUrl: './my-books.component.html',
  styleUrls: ['./my-books.component.css']
})
export class MyBooksComponent implements OnInit {
  greetingMessage = '';
  userName = '';
  userRole: AuthType | null = null;
  searchTerm = '';

  isLoading$ = new BehaviorSubject<boolean>(true);
  showWaveformLoader = false;

  BookType = BookType;
  AuthType = AuthType; // لتستخدمه في القالب

  constructor(private session: LandingAuthSessionService) { }

  ngOnInit(): void {
    const user = this.session.user;
    this.userName = user ? user.first_name : '';
    this.userRole = user ? (user.auth_type as AuthType) : null;

    this.setGreeting();
    this.simulateLoading();
    this.processBooks();
  }

  // بيانات تجريبية
  books: AudioBook[] = [
    {
      id: 1,
      title: 'Echoes of the Forgotten',
      isbn: '978-0-100000-11-1',
      book_cover: 'https://dorrance-new-backend.nstechs.net/content/images/books/book-1.jpg',
      variants: [1, 2],
      project_id: null,
      imageLoaded: false
    },
    {
      id: 2,
      title: 'The Mamba Mentality',
      isbn: '978-1-4809-0601-3',
      book_cover: 'https://dorrance-new-backend.nstechs.net/content/images/books/book-2.jpg',
      variants: [2],
      project_id: 14,
      imageLoaded: false
    },
    {
      id: 3,
      title: 'Profiles in Corruption',
      isbn: '978-1-6453-0157-8',
      book_cover: 'https://dorrance-new-backend.nstechs.net/content/images/books/book-3.jpg',
      variants: [1],
      project_id: null,
      imageLoaded: false
    },
    {
      id: 4,
      title: 'Atomic Habits',
      isbn: '978-0-7352-1129-2',
      book_cover: 'https://dorrance-new-backend.nstechs.net/content/images/books/book-4.jpg',
      variants: [1, 2],
      project_id: 22,
      imageLoaded: false
    },
    {
      id: 5,
      title: 'The Power of Now',
      isbn: '978-1-5773-1480-0',
      book_cover: 'https://dorrance-new-backend.nstechs.net/content/images/books/book-5.jpg',
      variants: [2],
      project_id: null,
      imageLoaded: false
    },
    {
      id: 6,
      title: 'Rich Dad Poor Dad',
      isbn: '978-1-6126-8000-3',
      book_cover: 'https://dorrance-new-backend.nstechs.net/content/images/books/book-6.jpg',
      variants: [1],
      project_id: 7,
      imageLoaded: false
    }
  ];


  // تحديد نوع الكتاب من الـ variants
  private processBooks(): void {
    this.books.forEach(book => (book.type = this.getBookType(book)));
  }

  private getBookType(book: AudioBook): BookType {
    const hasEbook = book.variants.includes(VariantType.EBook);
    const hasAudio = book.variants.includes(VariantType.ABook);
    if (hasEbook && hasAudio) return BookType.HYBRID;
    if (hasAudio) return BookType.AUDIO;
    if (hasEbook) return BookType.EBOOK;
    return BookType.EBOOK;
  }

  filteredBooks(): AudioBook[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.books;
    return this.books.filter(
      b => b.title.toLowerCase().includes(term) || b.isbn.toLowerCase().includes(term)
    );
  }

  onImageLoad(book: AudioBook): void {
    book.imageLoaded = true;
  }

  hasAudio(book: AudioBook): boolean {
    return book.variants.includes(VariantType.ABook);
  }

  hasReading(book: AudioBook): boolean {
    return book.variants.includes(VariantType.EBook);
  }

  getBookTypeLabel(book: AudioBook): string {
    switch (book.type) {
      case BookType.AUDIO: return 'Audio Book';
      case BookType.EBOOK: return 'E-Book';
      case BookType.HYBRID: return 'Audio + E-Book';
      default: return '';
    }
  }

  getBookTypeIcon(book: AudioBook): string {
    switch (book.type) {
      case BookType.AUDIO: return 'bi-headphones';
      case BookType.EBOOK: return 'bi-book';
      case BookType.HYBRID: return 'bi-collection-play';
      default: return '';
    }
  }

  private simulateLoading(): void {
    setTimeout(() => {
      this.isLoading$.next(false);
      this.showWaveformLoader = true;
      setTimeout(() => (this.showWaveformLoader = false), 800);
    }, 1200);
  }

  // 🌟 Dynamic greeting based on time + user role
  private setGreeting(): void {
    const hour = new Date().getHours();
    const name = this.userName ? `, ${this.userName}` : '';

    let baseGreeting = '';
    if (hour >= 5 && hour < 12) baseGreeting = `Good morning${name}`;
    else if (hour >= 12 && hour < 17) baseGreeting = `Good afternoon${name}`;
    else if (hour >= 17 && hour < 24) baseGreeting = `Good evening${name}`;
    else baseGreeting = `Up late${name}?`;

    // 🎭 تخصيص الرسائل حسب نوع المستخدم
    switch (this.userRole) {
      case AuthType.Author:
        this.greetingMessage = [
          `${baseGreeting}, ready to share your next masterpiece? 🖋️`,
          `A new chapter awaits your creative touch ✨`,
          `The world is waiting for your next story to be told 📖`
        ][Math.floor(Math.random() * 3)];
        break;

      case AuthType.Editor:
        this.greetingMessage = [
          `${baseGreeting}, time to refine brilliance into perfection ✏️`,
          `Grab your red pen, stories need your magic today 🔍`,
          `A polished book is a beautiful book — let's make it shine 💫`
        ][Math.floor(Math.random() * 3)];
        break;

      case AuthType.Customer:
        this.greetingMessage = [
          `${baseGreeting}, let's dive into your next audio adventure 🎧`,
          `A perfect time to explore new voices and stories 📚`,
          `Relax and listen — your next favorite book is waiting 🎵`
        ][Math.floor(Math.random() * 3)];
        break;

      case AuthType.Admin:
        this.greetingMessage = [
          `${baseGreeting}, overseeing the world of stories again, are we? 🧠`,
          `The realm of authors and editors awaits your guidance 👑`,
          `Let's keep the Dorrance universe running smoothly ⚙️`
        ][Math.floor(Math.random() * 3)];
        break;

      default:
        this.greetingMessage = `${baseGreeting}, welcome back to Dorrance Audio Book 💫`;
    }
  }

  // الكتاب يحتوي على صوتي أو هايبرد
  isAudioCapable(book: AudioBook): boolean {
    return book.type === BookType.AUDIO || book.type === BookType.HYBRID;
  }

  // يحتاج إعداد مشروع صوتي (صوتي أو هايبرد ولكن بدون project_id)
  audioSetupRequired(book: AudioBook): boolean {
    return this.isAudioCapable(book) && !book.project_id;
  }

  // جاهز كمشروع صوتي (صوتي أو هايبرد وبداخله project_id)
  audioReady(book: AudioBook): boolean {
    return this.isAudioCapable(book) && !!book.project_id;
  }

  // 📍 Unified handler for all button actions
  onBookPrimaryAction(book: AudioBook): void {
    if (!this.userRole) return;

    switch (this.userRole) {
      case AuthType.Customer:
        this.handleCustomerAction(book);
        break;
      case AuthType.Author:
        this.handleAuthorAction(book);
        break;
      case AuthType.Editor:
        this.handleEditorAction(book);
        break;
    }
  }

  private handleCustomerAction(book: AudioBook): void {
    if (this.audioReady(book)) {
      console.log(`🎧 Listening project #${book.project_id}`);
    } else if (book.type === BookType.EBOOK) {
      console.log(`📖 Reading book #${book.id}`);
    } else {
      console.log('🛒 Redirect to shop (book not owned)');
    }
  }

  private handleAuthorAction(book: AudioBook): void {
    if (this.audioSetupRequired(book)) {
      console.log(`🛠️ Open Audio Setup Modal for book #${book.id}`);
      // هنا لاحقًا هنفتح المودال
    } else if (this.audioReady(book)) {
      console.log(`🎬 Open audio project page #${book.project_id}`);
    } else {
      console.log(`📘 Open eBook reader for book #${book.id}`);
    }
  }

  private handleEditorAction(book: AudioBook): void {
    if (this.audioReady(book)) {
      console.log(`✏️ Open editor project #${book.project_id}`);
    }
  }


}
