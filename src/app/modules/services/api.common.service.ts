import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { VoicesApiResponse } from 'src/app/core/models/voice.model';

const API_BASE_URL = `${environment.apiUrl}/`;

// ========== INTERFACES ==========
export interface Country {
  id: number;
  name: string;
  code: string; // مثال: +1, +966, +20
}

export interface CountriesApiResponse {
  status: boolean;
  status_code: number;
  message: string;
  data: Country[];
}

@Injectable({
	providedIn: 'root'
})

// Portal - User APIs
export class ApiPublicService {
  private readonly base = `${environment.apiUrl}/`;

  // Cache للبيانات الثابتة
  private voicesCache$?: Observable<VoicesApiResponse>;
  private countriesCache$?: Observable<CountriesApiResponse>;

  // للتوافق مع الكود القديم
  public common = {
    list: this.base + 'common/voices', // GET
    countries: this.base + 'common/countries', // GET
  };

  constructor(private http: HttpClient) {}

  // ========== Voices API ==========
  
  /**
   * جلب قائمة الأصوات المتاحة (مع Cache)
   * GET /common/voices
   * @returns Observable<VoicesApiResponse>
   */
  getVoices(): Observable<VoicesApiResponse> {
    if (!this.voicesCache$) {
      this.voicesCache$ = this.http.get<VoicesApiResponse>(`${this.base}common/voices`).pipe(
        shareReplay(1) // Cache النتيجة ومشاركتها مع جميع المشتركين
      );
    }
    return this.voicesCache$;
  }

  // ========== Countries API ==========
  
  /**
   * جلب قائمة الدول مع أكواد الاتصال (مع Cache)
   * GET /common/countries
   * @returns Observable<CountriesApiResponse>
   */
  getCountries(): Observable<CountriesApiResponse> {
    if (!this.countriesCache$) {
      this.countriesCache$ = this.http.get<CountriesApiResponse>(`${this.base}common/countries`).pipe(
        shareReplay(1) // Cache النتيجة - تُضرب مرة واحدة فقط
      );
    }
    return this.countriesCache$;
  }

  /**
   * مسح الـ Cache (إذا احتجت refresh للبيانات)
   */
  clearCache() {
    this.voicesCache$ = undefined;
    this.countriesCache$ = undefined;
  }
}
