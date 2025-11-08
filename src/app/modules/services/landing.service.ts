import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { environment } from 'src/environments/environment';

//  Interfaces بناءً على الداتا الجديدة
export interface Hero {
  background: string;
  slides: { img: string; alt: string }[];
}

export interface IntroTrust {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturedBook {
  img: string;
  title: string;
  author: string;
  price: string;
}

export interface Category {
  icon: string;
  title: string;
  count: string;
}

export interface Book {
  img: string;
  title: string;
  author: string;
  price: string;
  rating?: number;
}

export interface StaffPicks {
  staff: { img: string; name: string; position: string; quote: string };
  books: Book[];
}

export interface AwardWinners {
  firstRow: Book[];
  secondRow: Book[];
}

export interface Testimonial {
  id: number;
  name: string;
  position: string;
  image: string;
  rating: number;
  testimonial: string;
}

export interface Blog {
  img: string;
  title: string;
  description: string;
  link: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface LandingPageData {
  hero: Hero;
  introTrust: IntroTrust[];
  featuredBooks: FeaturedBook[];
  categories: Category[];
  bestsellingBooks: Book[];
  staffPicks: StaffPicks;
  awardWinners: AwardWinners;
  testimonials: Testimonial[];
  blogs: Blog[];
  settings: Setting[]; //  مصفوفة، مش object
}


//  Models for Contact
export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  status: boolean;
  data: {
    id: number;
    name: string;
    email: string;
    message: string;
    created_at?: string;
  };
  message: string;
}

export interface ApiResponse<T = any> {
  status: boolean;   
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private readonly API_BASE_URL = `${environment.apiUrl}`;

  constructor(private httpService: HttpService) { }

  /**
   * جلب بيانات الصفحة الرئيسية من الـ API
   */
  getHomeData(): Observable<ApiResponse<LandingPageData>> {
    const url = `${this.API_BASE_URL}/website/home`;
    return this.httpService.listGet(url, 'homeData');
  }


  /**
   * تحويل الـ settings array إلى object للوصول السهل
   */
  parseSettings(settings: Setting[]): { [key: string]: string } {
    const parsedSettings: { [key: string]: string } = {};
    settings.forEach(setting => {
      parsedSettings[setting.key] = setting.value;
    });
    return parsedSettings;
  }

  /**
   * إرسال رسالة اتصال إلى الـ API
   */
  sendContactMessage(contactData: ContactMessage): Observable<ContactResponse> {
    if (!contactData.name?.trim() || !contactData.email?.trim() || !contactData.message?.trim()) {
      throw new Error('جميع الحقول مطلوبة');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactData.email.trim())) {
      throw new Error('صيغة البريد الإلكتروني غير صحيحة');
    }

    const cleanData: ContactMessage = {
      name: contactData.name.trim(),
      email: contactData.email.trim().toLowerCase(),
      message: contactData.message.trim()
    };

    const url = `${this.API_BASE_URL}/home/contact-messages`;
    return this.httpService.action(url, cleanData, 'contactMessage');
  }
}
