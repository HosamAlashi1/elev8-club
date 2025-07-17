import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../dash/services/api.service';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}`;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  isAuthLoading$: Observable<boolean>;
  isAuthLoadingSubject: BehaviorSubject<boolean>;

  constructor(private http: HttpClient, private router: Router, private apiService: ApiService) {
    this.isAuthLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isAuthLoading$ = this.isAuthLoadingSubject.asObservable();
  }

  login(email: string, password: string): Observable<any> {
    this.isAuthLoadingSubject.next(true);

    return this.http.post<any>(`${API_BASE_URL}/login`, { email, password }).pipe(
      tap({
        next: (res: any) => {
          if (res?.status === true && res?.items?.access_token) {
            localStorage.setItem('Turbo-eat-data', JSON.stringify(res.items));
          }
        },
        error: (err: any) => err,
        finalize: () => this.isAuthLoadingSubject.next(false)
      })
    );
  }

  forget(email: string): Observable<any> {
    this.isAuthLoadingSubject.next(true);
    return this.http.post<any>(`${API_BASE_URL}/forget-password`, { email }).pipe(
      tap({
        next: (res: any) => res,
        error: (err: any) => err,
        finalize: () => this.isAuthLoadingSubject.next(false)
      })
    );
  }

  reset(id: string, password: string): Observable<any> {
    this.isAuthLoadingSubject.next(true);
    return this.http.post<any>(`${API_BASE_URL}/reset-password`, { id, password }).pipe(
      tap({
        next: (res: any) => res,
        error: (err: any) => err,
        finalize: () => this.isAuthLoadingSubject.next(false)
      })
    );
  }

  logout() {
    this.http.post(`${API_BASE_URL}/logout`, {}).subscribe({
      next: () => {
        
        localStorage.removeItem('Turbo-eat-data');
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        
        localStorage.removeItem('Turbo-eat-data');
        this.router.navigate(['/auth/login']);
      }
    });
  }

}
