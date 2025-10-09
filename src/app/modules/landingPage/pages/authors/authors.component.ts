import { Component, OnInit } from '@angular/core';
import { ApiLandingService } from '../../../services/api.landing.service';
import { HttpService } from 'src/app/modules/services/http.service';

interface Author {
  name: string;
  book: string;
  description: string;
  image: string;
  reverse?: boolean;
  link?: string;
}

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.css']
})
export class AuthorsComponent implements OnInit {
  title = 'Featured Authors';
  subtitle = 'Discover Our Most Notable Writers';

  authors: Author[] = [];
  isLoading = false;
  errorMsg = '';

  constructor(
    private api: ApiLandingService,
    private http: HttpService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedAuthors();
  }

  loadFeaturedAuthors(): void {
    this.isLoading = true;
    this.http.listGet(this.api.featured_author.list, 'featured_author').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res?.data)) {
          // 🧠 تحويل الـ response إلى الـ interface المحلي
          this.authors = res.data.map((item: any, index: number) => ({
            name: item.author?.full_name ?? 'Unknown Author',
            book: item.title,
            description: item.description,
            image: item.author?.image || 'assets/img/landing/featured-author/default.png',
            reverse: index % 2 !== 0, // قلب التصميم كل ثاني كارد
            link: `/author/${item.author?.id ?? 0}`
          }));
        } else {
          this.errorMsg = 'No featured authors found.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching featured authors:', err);
        this.errorMsg = 'Failed to load featured authors.';
        this.isLoading = false;
      }
    });
  }
}
