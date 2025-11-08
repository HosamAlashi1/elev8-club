import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';
import { LandingAuthApiService, SignupRequest } from './landing-auth-api.service';
import { AuthType } from 'src/app/core/enums/auth-type.enum';

export interface LandingAuthUser {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  auth_type: AuthType; // الآن Enum بدل رقم
  image?: string;
}

export interface LandingAuthPayload {
  user: LandingAuthUser;
  token: string;
  device_id?: string;
}

export interface LandingAuthState {
  isLoggedIn: boolean;
  user: LandingAuthUser | null;
  token: string | null;
  device_id?: string | null;
}

const STORAGE_KEY = `${environment.prefix}-landing-data`;

@Injectable({ providedIn: 'root' })
export class LandingAuthSessionService {
  private state: LandingAuthState = { isLoggedIn: false, user: null, token: null, device_id: null };
  private state$ = new BehaviorSubject<LandingAuthState>(this.state);

  constructor(private api: LandingAuthApiService) {
    this.loadFromStorage();

    // مزامنة بين التبويبات
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this.loadFromStorage(false);
      }
    });
  }

  // Observables & snapshot
  get auth$(): Observable<LandingAuthState> { return this.state$.asObservable(); }
  get snapshot(): LandingAuthState { return this.state; }
  get isLoggedIn(): boolean { return this.state.isLoggedIn; }
  get token(): string | null { return this.state.token; }
  get user(): LandingAuthUser | null { return this.state.user; }

  // Getter خاص للنوع كـ Enum
  get userRole(): AuthType | null {
    return this.state.user?.auth_type ?? null;
  }

  // --- Public API ---
  login(
    email: string,
    password: string,
    auth_type: number = 4,
    fcm_token: string = '',
    device_id: string = ''
  ) {
    return this.api.login(email, password, auth_type, fcm_token, device_id).pipe(
      tap((res: any) => {
        if (res?.status && res?.data?.access_token && res?.data?.data) {
          const payload: LandingAuthPayload = {
            user: res.data.data as LandingAuthUser,
            token: res.data.access_token as string,
            device_id
          };
          this.setSession(payload);
        }
      })
    );
  }

  signup(form: SignupRequest, file?: File): Observable<any> {
    const body = { ...form, auth_type: form.auth_type ?? AuthType.Customer };
    return this.api.signup(body, file);
  }

  confirmCode(email: string, code: string): Observable<any> {
    return this.api.confirmCode(email, code);
  }

  resendCode(email: string): Observable<any> {
    return this.api.resendCode(email);
  }

  logout() {
    const device_id = this.state.device_id ?? undefined;
    this.clearSession();
    if (device_id) this.api.logout(device_id).subscribe({ next: () => {}, error: () => {} });
  }

  // --- Internals ---
  private setSession(payload: LandingAuthPayload) {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), environment.cryptoKey).toString();
    localStorage.setItem(STORAGE_KEY, encrypted);

    this.state = {
      isLoggedIn: true,
      user: payload.user,
      token: payload.token,
      device_id: payload.device_id ?? null
    };
    this.state$.next({ ...this.state });
  }

  private clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = { isLoggedIn: false, user: null, token: null, device_id: null };
    this.state$.next({ ...this.state });
  }

  private loadFromStorage(silent = true) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (!silent) this.state$.next({ ...this.state });
      return;
    }
    try {
      const json = CryptoJS.AES.decrypt(raw, environment.cryptoKey).toString(CryptoJS.enc.Utf8);
      const payload: LandingAuthPayload = JSON.parse(json);
      this.state = {
        isLoggedIn: !!payload?.token,
        user: payload?.user ?? null,
        token: payload?.token ?? null,
        device_id: payload?.device_id ?? null
      };
    } catch {
      this.state = { isLoggedIn: false, user: null, token: null, device_id: null };
    }
    this.state$.next({ ...this.state });
  }
}
