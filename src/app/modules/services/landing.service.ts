import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { environment } from 'src/environments/environment';

export interface AppPreview {
  id: number;
  image: string;
}

export interface Feature {
  id: number;
  title: string;
  image: string;
  description: string;
}

export interface Process {
  id: number;
  step: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: number;
  name: string;
  position: string;
  image: string;
  rating: number;
  testimonial: string;
}

export interface Setting {
  id: number;
  key_id: string;
  title: string;
  type: string;
  value: string;
}

export interface LandingPageData {
  app_previews: AppPreview[];
  features: Feature[];
  processes: Process[];
  testimonials: Testimonial[];
  settings: {
    '': Setting[];
  };
}

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

export interface ApiResponse {
  status: boolean;
  data: LandingPageData;
  message: string;
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
  getHomeData(): Observable<ApiResponse> {
    const url = `${this.API_BASE_URL}/home`;
    return this.httpService.listGet(url, 'homeData');
  }

  /**
   * تحويل الـ settings array إلى object للوصول السهل
   */
  parseSettings(settings: Setting[]): { [key: string]: string } {
    const parsedSettings: { [key: string]: string } = {};
    settings.forEach(setting => {
      parsedSettings[setting.key_id] = setting.value;
    });
    return parsedSettings;
  }

  /**
   * إرسال رسالة اتصال إلى الـ API
   */
  sendContactMessage(contactData: ContactMessage): Observable<ContactResponse> {
    // التحقق من البيانات قبل الإرسال
    if (!contactData.name?.trim() || !contactData.email?.trim() || !contactData.message?.trim()) {
      throw new Error('جميع الحقول مطلوبة');
    }

    // التحقق من صيغة البريد الإلكتروني
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactData.email.trim())) {
      throw new Error('صيغة البريد الإلكتروني غير صحيحة');
    }

    // تنظيف البيانات
    const cleanData: ContactMessage = {
      name: contactData.name.trim(),
      email: contactData.email.trim().toLowerCase(),
      message: contactData.message.trim()
    };

    const url = `${this.API_BASE_URL}/home/contact-messages`;
    return this.httpService.action(url, cleanData, 'contactMessage');
  }
}
