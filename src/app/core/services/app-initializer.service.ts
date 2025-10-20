import { Injectable } from '@angular/core';
import { LandingService } from '../../modules/services/landing.service';
import { timeout, catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private isDataLoaded = false;
  private cachedData: any = null;

  constructor(
    private landingService: LandingService
  ) { }

  /**
   * دالة التهيئة التي ستعمل قبل بدء التطبيق
   */
 initialize(): Promise<any> {
  console.log('🚀 APP_INITIALIZER: Starting application initialization...');

  return new Promise((resolve) => {
    this.landingService.getHomeData()
      .pipe(
        timeout(15000),
        catchError((error) => {
          console.error('❌ APP_INITIALIZER: Failed to load initial data:', error);
          this.setFallbackData();
          return of({ success: false, data: null });
        }),
        tap((response) => {
          console.log('📦 Response from API:', response);
          if (response?.success && response?.data) {
            this.cachedData = response.data;
            this.isDataLoaded = true;
          } else {
            this.setFallbackData();
          }
        })
      )
      .subscribe({
        next: () => {
          console.log('🎉 APP_INITIALIZER: Application ready to start');
          resolve(true);
        },
        error: (err) => {
          console.error('💥 APP_INITIALIZER error:', err);
          this.setFallbackData();
          resolve(true);
        },
        complete: () => {
          console.log('✅ APP_INITIALIZER: Observable completed');
          resolve(true);
        }
      });
  });
}


  getPreloadedData(): any {
    return this.cachedData;
  }

  isAppDataLoaded(): boolean {
    return this.isDataLoaded;
  }

  /**
   * البيانات الاحتياطية من التصميم
   */
  private setFallbackData(): void {
    this.cachedData = {
      hero: {
        background: 'assets/img/landing/home/hero/bg.png',
        slides: [
          { img: 'assets/img/landing/home/hero/book1.png', alt: 'Book 1' },
          { img: 'assets/img/landing/home/hero/book2.png', alt: 'Book 2' }
        ]
      },

      introTrust: [
        { icon: 'assets/img/landing/home/intro-trust/consultation.png', title: 'Consultation', description: 'Expert guidance on your publishing journey' },
        { icon: 'assets/img/landing/home/intro-trust/book-production.png', title: 'Book Production', description: 'State-of-the-art printing and digital publishing' },
        { icon: 'assets/img/landing/home/intro-trust/distribution.png', title: 'Distribution', description: 'Wide-reaching distribution network' }
      ],

      featuredBooks: [
        { id: 'book1', img: 'assets/img/landing/home/featured-books/book1.png', title: 'The Art of Storytelling', author: 'Sarah Johnson', price: '$24.99', rating: 4.5 },
        { id: 'book2', img: 'assets/img/landing/home/featured-books/book2.png', title: 'Modern Philosophy', author: 'Michael Chen', price: '$29.99', rating: 4.0 },
        { id: 'book3', img: 'assets/img/landing/home/featured-books/book3.png', title: 'The Silent Echo', author: 'Emily Parker', price: '$19.99', rating: 5.0 },
        { id: 'book4', img: 'assets/img/landing/home/featured-books/book4.png', title: 'Digital Revolution', author: 'David Wilson', price: '$27.99', rating: 4.8 }
      ],

      categories: [
        { icon: 'assets/img/landing/home/categories/icon1.png', title: 'Fiction', count: '2,345 Books' },
        { icon: 'assets/img/landing/home/categories/icon2.png', title: 'Non-Fiction', count: '1,987 Books' },
        { icon: 'assets/img/landing/home/categories/icon3.png', title: 'Biography', count: '982 Books' },
        { icon: 'assets/img/landing/home/categories/icon4.png', title: 'Romance', count: '1,250 Books' },
        { icon: 'assets/img/landing/home/categories/icon5.png', title: 'Academic', count: '713 Books' },
        { icon: 'assets/img/landing/home/categories/icon6.png', title: "Children's", count: '1,120 Books' }
      ],

      bestsellingBooks: [
        { id: 'book1', img: 'assets/img/landing/home/books/book1.png', title: 'The Creative Mind', author: 'Sarah Johnson', price: '$25.99', rating: 5 },
        { id: 'book2', img: 'assets/img/landing/home/books/book2.png', title: 'Future of AI', author: 'John King', price: '$32.99', rating: 4.5 },
        { id: 'book3', img: 'assets/img/landing/home/books/book3.png', title: 'Mountain Dreams', author: 'David Lee', price: '$19.95', rating: 4 },
        { id: 'book4', img: 'assets/img/landing/home/books/book4.png', title: 'Urban Tales', author: 'Rachel Smith', price: '$24.50', rating: 5 }
      ],

      staffPicks: {
        staff: {
          img: 'assets/img/landing/home/staff-picks/staff.png',
          name: 'Emily Parker',
          position: 'Chief Editor',
          quote: 'Award-winning author of contemporary fiction. Her latest novel "The Silent Echo" has been hailed as a masterpiece of modern storytelling.',
          books: [
            { id: 'book1', img: 'assets/img/landing/home/staff-picks/book1.png', title: 'The Silent Echo', author: 'Emily Parker', price: '$19.99' }
          ]
        },
        books: [
          { id: 'book1', img: 'assets/img/landing/home/books/book1.png', title: 'The Creative Mind', author: 'Sarah Johnson', price: '$25.99', rating: 5 },
          { id: 'book2', img: 'assets/img/landing/home/books/book2.png', title: 'Future of AI', author: 'John King', price: '$32.99', rating: 4.5 }
        ]
      },

      awardWinners: {
        firstRow: [
          { id: 'book1', img: 'assets/img/landing/home/books/book1.png', title: 'The Creative Mind', author: 'Sarah Johnson', price: '$25.99', rating: 5 },
          { id: 'book2', img: 'assets/img/landing/home/books/book2.png', title: 'Future of AI', author: 'John King', price: '$32.99', rating: 4.5 }
        ],
        secondRow: [
          { id: 'book3', img: 'assets/img/landing/home/books/book3.png', title: 'Mountain Dreams', author: 'David Lee', price: '$19.95', rating: 4 },
          { id: 'book4', img: 'assets/img/landing/home/books/book4.png', title: 'Urban Tales', author: 'Rachel Smith', price: '$24.50', rating: 5 }
        ]
      },

      testimonials: [
        { id: 1, name: 'Sarah Thompson', image: 'assets/img/landing/home/testimonials/person1.png', rating: 5, testimonial: 'The best online bookstore I\'ve ever used. Fast shipping and excellent customer service!' },
        { id: 2, name: 'Michael Chen', image: 'assets/img/landing/home/testimonials/person2.png', rating: 5, testimonial: 'Amazing selection of books and great prices. I\'ve discovered so many wonderful authors here.' },
        { id: 3, name: 'Emma Watson', image: 'assets/img/landing/home/testimonials/person3.png', rating: 4, testimonial: 'The perfect place to find both popular bestsellers and hidden gems. Highly recommended!' }
      ],

      blogs: [
        { img: 'assets/img/landing/home/blogs/blog1.png', title: 'The Future of Reading: Digital vs. Physical Books', description: 'Explore how reading is being reshaped in the digital age...', link: '/blog/1' },
        { img: 'assets/img/landing/home/blogs/blog2.png', title: 'The Joy of Collecting Books in Modern Times', description: 'Why physical books still hold a special place...', link: '/blog/2' },
        { img: 'assets/img/landing/home/blogs/blog3.png', title: 'Top 10 Must-Read Books of the Year', description: 'Curated list of the most influential books this year...', link: '/blog/3' }
      ],

      settings: [
        { key: 'hero_title', value: 'Discover Your Next Literary Adventure' },
        { key: 'hero_subtitle', value: 'Curated collection of finest literature' },
        { key: 'services_title', value: 'America\'s Oldest Publishing Services Company' },
        { key: 'services_subtitle', value: 'Trusted for 100+ Years' },
        { key: 'featured_title', value: 'Featured Books' },
        { key: 'category_title', value: 'Browse by Category' },
        { key: 'bestselling_title', value: 'Bestselling Books' },
        { key: 'staff_title', value: 'August Staff Picks' },
        { key: 'awards_title', value: 'Recent Award Winners' },
        { key: 'testimonials_title', value: 'What People Say' },
        { key: 'subscribe_title', value: 'Join Our Literary Community' },
        { key: 'subscribe_subtitle', value: 'Subscribe to receive new releases, author events, special offers, and exclusive content.' },
        { key: 'blog_title', value: 'Latest From Our Blog' },
        { key: 'contact_title', value: 'Contact Us' },
        { key: 'footer_title', value: 'America\'s Oldest Publishing Services Company — Trusted for 100+ Years.' },
        { key: 'contact_phone', value: '(800) 123-4567' },
        { key: 'contact_email', value: 'support@literaryhaven.com' },
        { key: 'contact_address', value: '123 Library Lane, Booktown, BT 56789' },
        { key: 'contact_hours_weekdays', value: 'Monday - Friday: 9:00 AM - 8:00 PM' },
        { key: 'contact_hours_saturday', value: 'Saturday: 10:00 AM - 6:00 PM' },
        { key: 'contact_hours_sunday', value: 'Sunday: Closed' },
        { key: 'social_facebook', value: 'https://facebook.com' },
        { key: 'social_twitter', value: 'https://twitter.com' },
        { key: 'social_instagram', value: 'https://instagram.com' },
        { key: 'social_pinterest', value: 'https://pinterest.com' },
        { key: 'social_youtube', value: 'https://youtube.com' },
        { key: 'social_tiktok', value: 'https://tiktok.com' }
      ]
    };

    this.isDataLoaded = true;
    console.log('🎭 APP_INITIALIZER: Fallback data set ready');
  }
}
