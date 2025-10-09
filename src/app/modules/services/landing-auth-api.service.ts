import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

const API_BASE_URL = `${environment.apiUrl}`;

export interface SignupRequest {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  auth_type?: number; // always 4 for customer
}

@Injectable({ providedIn: 'root' })
export class LandingAuthApiService {
  constructor(private http: HttpClient) { }

  login(
    email: string,
    password: string,
    auth_type: number = 4,
    fcm_token: string = '',
    device_id: string = ''
  ): Observable<any> {
    const body = { email, password, auth_type, fcm_token, device_id };
    return this.http.post<any>(`${API_BASE_URL}/Auth/login`, body);
  }

  signup(body: SignupRequest & { auth_type?: number }, file?: File | null): Observable<any> {
    const auth_type = body.auth_type ?? 4;

    if (file) {
      const fd = new FormData();
      fd.append('first_name', body.first_name);
      fd.append('middle_name', body.middle_name ?? '');
      fd.append('last_name', body.last_name);
      fd.append('email', body.email);
      fd.append('phone', body.phone ?? '');
      fd.append('auth_type', String(auth_type));
      fd.append('file', file);
      return this.http.post<any>(`${API_BASE_URL}/Auth/signup`, fd);
    }

    const payload = { ...body, auth_type };
    return this.http.post<any>(`${API_BASE_URL}/Auth/signup`, payload);
  }

  /** POST /Auth/logout — optional device_id */
  logout(device_id?: string): Observable<any> {
    const body = device_id ? { device_id } : {};
    return this.http.post<any>(`${API_BASE_URL}/Auth/logout`, body);
  }
}
