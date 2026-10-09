import { Injectable } from '@angular/core';
import { Observable, merge, of, timer } from 'rxjs';
import { catchError, distinctUntilChanged, first, map, shareReplay, switchMap, timeout } from 'rxjs/operators';
import { LandingSettingsService } from './landing-settings.service';

/**
 * Whether this landing page's registration window has closed.
 *
 * Every landing page (v1, v2, v3) has its own date, set from the dashboard's General Settings; this
 * one reads `settings/start_counter_date` (the webinar). Once that date has passed the landing page is hidden and only
 * the "registration is currently closed" page is shown.
 *
 * "No date" is NOT "closed": an unset (or cleared) date means the campaign has no deadline, so the
 * site stays open — the same rule that hides the countdown. Only a date that is set and in the past
 * closes it. It also follows the clock: a visitor still on the page when the date arrives is moved
 * to the closed page, and a date moved later in the dashboard brings the page back.
 */
@Injectable({ providedIn: 'root' })
export class CampaignGateService {
  /** The page is closed, now and from here on. Emits again at the moment the date arrives. */
  readonly closed$: Observable<boolean>;

  constructor(settings: LandingSettingsService) {
    this.closed$ = settings.getStartCounterDate().pipe(
      switchMap((date) => {
        if (!date) { return of(false); }
        const left = date - Date.now();
        if (left <= 0) { return of(true); }
        // setTimeout cannot wait longer than ~24.8 days: re-check in steps for a distant date.
        return merge(of(false), timer(Math.min(left, 2_000_000_000)).pipe(map(() => Date.now() >= date)));
      }),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * The answer for a route guard: the first value, but never longer than 2.5s. If the setting cannot
   * be read at all (offline, blocked) the page opens rather than hanging on a blank screen.
   */
  isClosedNow(): Observable<boolean> {
    return this.closed$.pipe(first(), timeout(2500), catchError(() => of(false)));
  }
}
