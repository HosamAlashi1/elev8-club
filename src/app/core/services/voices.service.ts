import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ApiPublicService } from 'src/app/modules/services/api.public.service';
import { Voice } from '../models/voice.model';

// ========== Constants ==========
const PLACEHOLDER_IMAGE = 'assets/img/blank.png';

// TTL (Time To Live) للكاش: 30 دقيقة
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * ========================================
 * Voices Service - خدمة مركزية للأصوات
 * ========================================
 * 
 * الميزات:
 * -  كاش ذكي (shareReplay) لتجنب تكرار الطلبات
 * -  تحديث تلقائي كل 30 دقيقة
 * -  Force Refresh عند الحاجة
 * -  معالجة أخطاء API مع رسائل واضحة
 * -  دعم المستقبل للصور من الـ API
 * 
 * الاستخدام في أي Component:
 * ```typescript
 * constructor(private voicesSvc: VoicesService) {}
 * 
 * ngOnInit() {
 *   this.voicesSvc.getVoices().subscribe(voices => {
 *     this.voices = voices;
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class VoicesService {
  // Stream مع كاش: أول اشتراك يضرب API، الباقي يستخدم النتيجة المحفوظة
  private voices$?: Observable<Voice[]>;

  constructor(private api: ApiPublicService) {}

  /**
   * جلب قائمة الأصوات (مع كاش ذكي)
   * @param forceRefresh - إجبار تحديث البيانات من السيرفر
   * @returns Observable<Voice[]>
   */
  getVoices(forceRefresh = false): Observable<Voice[]> {
    // إذا فيه كاش موجود ومش مطلوب refresh → استخدم الكاش
    if (this.voices$ && !forceRefresh) {
      return this.voices$;
    }

    // إنشاء stream جديد مع كاش
    this.voices$ = timer(0, CACHE_TTL_MS).pipe(
      // ضرب الـ API كل TTL_MS (أو مرة وحدة إذا ما فيه timer)
      switchMap(() => this.api.getVoices()),
      
      // تحويل Response لـ Voice Model
      map(response => {
        if (!response?.success || !response?.data) {
          throw new Error('Invalid API response structure');
        }
        return response.data.map(v => this.mapToVoiceModel(v));
      }),
      
      // معالجة الأخطاء: إرجاع الخطأ للمستخدم بدون fallback
      catchError(error => {
        console.error(' Failed to fetch voices from API:', error);
        return throwError(() => ({
          message: 'Failed to load voices. Please check your connection and try again.',
          originalError: error
        }));
      }),
      
      // Debug logging
      tap(voices => console.log(` Voices loaded from API: ${voices.length} voices`)),
      
      // ⭐ الكاش السحري: shareReplay
      // - bufferSize: 1 → احفظ آخر نتيجة
      // - refCount: true → امسح الكاش لما ما يبقى في subscriptions
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return this.voices$;
  }

  /**
   * فلترة الأصوات حسب الجنس
   */
  getVoicesByGender(gender: 'Male' | 'Female' | 'Neutral'): Observable<Voice[]> {
    return this.getVoices().pipe(
      map(voices => voices.filter(v => v.gender === gender))
    );
  }

  /**
   * الحصول على صوت معين بالـ key
   */
  getVoiceByKey(key: string): Observable<Voice | undefined> {
    return this.getVoices().pipe(
      map(voices => voices.find(v => v.key === key))
    );
  }

  /**
   * إعادة تحميل الأصوات من السيرفر
   */
  refreshVoices(): Observable<Voice[]> {
    return this.getVoices(true);
  }

  /**
   * تحويل الداتا من API Response إلى Voice Model
   */
  private mapToVoiceModel(apiVoice: any): Voice {
    return {
      key: apiVoice.key,
      name: apiVoice.name,
      gender: apiVoice.gender,
      sample: apiVoice.sample, // من الـ API مباشرة
      // مستقبلاً عند إضافة image في الـ API:
      image: apiVoice.image || PLACEHOLDER_IMAGE
    };
  }
}
