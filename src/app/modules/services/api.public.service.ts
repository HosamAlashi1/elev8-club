import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { VoicesApiResponse } from 'src/app/core/models/voice.model';

const API_BASE_URL = `${environment.apiUrl}/`;

@Injectable({
	providedIn: 'root'
})

// Portal - User APIs
export class ApiPublicService {
  private readonly base = `${environment.apiUrl}/`;

  // للتوافق مع الكود القديم
  public common = {
    list: this.base + 'common/voices', // GET
  };

  constructor(private http: HttpClient) {}

  // ========== Voices API ==========
  
  /**
   * جلب قائمة الأصوات المتاحة
   * GET /common/voices
   * @returns Observable<VoicesApiResponse>
   */
  getVoices(): Observable<VoicesApiResponse> {
    return this.http.get<VoicesApiResponse>(`${this.base}common/voices`);
  }
}
