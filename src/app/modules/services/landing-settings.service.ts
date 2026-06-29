import { Injectable } from '@angular/core';
import { Observable, concat, EMPTY, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, shareReplay, tap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';

export interface LandingSettings {
  [key: string]: any;
  start_counter_date?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LandingSettingsService {
  private readonly cacheKey = 'elev8_landing_settings_v1';
  private settings$?: Observable<LandingSettings | null>;

  constructor(private readonly firebaseService: FirebaseService) {}

  getSettings(): Observable<LandingSettings | null> {
    if (!this.settings$) {
      const cachedSettings = this.readCachedSettings();
      const cached$ = cachedSettings ? of(cachedSettings) : EMPTY;
      const firebase$ = this.firebaseService.getObject('settings').pipe(
        tap(settings => this.writeCachedSettings(settings)),
        catchError(error => {
          console.error('Error loading landing settings:', error);
          return EMPTY;
        })
      );

      this.settings$ = concat(cached$, firebase$).pipe(
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.settings$;
  }

  getStartCounterDate(): Observable<number> {
    return this.getSettings().pipe(
      map(settings => this.parseDate(settings?.start_counter_date))
    );
  }

  parseDate(dateValue: any): number {
    if (!dateValue) return 0;

    if (typeof dateValue === 'number') {
      return dateValue < 10000000000 ? dateValue * 1000 : dateValue;
    }

    if (typeof dateValue === 'string') {
      const trimmedValue = dateValue.trim();
      const numericValue = Number(trimmedValue);

      if (!Number.isNaN(numericValue)) {
        return numericValue < 10000000000 ? numericValue * 1000 : numericValue;
      }

      const timestamp = new Date(trimmedValue).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    }

    return 0;
  }

  private readCachedSettings(): LandingSettings | null {
    try {
      const rawSettings = localStorage.getItem(this.cacheKey);
      return rawSettings ? JSON.parse(rawSettings) : null;
    } catch {
      return null;
    }
  }

  private writeCachedSettings(settings: LandingSettings | null): void {
    if (!settings) return;

    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(settings));
    } catch {
      // Ignore storage quota/private-mode errors. Firebase data is still used in-memory.
    }
  }
}
