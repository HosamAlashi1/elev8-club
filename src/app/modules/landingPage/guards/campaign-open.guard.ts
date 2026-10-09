import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { CampaignGateService } from '../../services/campaign-gate.service';

/**
 * Keeps the landing pages behind the campaign's deadline: once this page's date has passed, a visit to
 * the home page lands on the "registration is closed" page instead. (The video-questions page
 * is not behind it — someone who registered before the deadline can still finish the next step.)
 */
export const campaignOpenGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(CampaignGateService).isClosedNow().pipe(map((closed) => (closed ? router.createUrlTree(['/closed']) : true)));
};

/** The closed page itself: only reachable while the campaign IS closed — otherwise back to the landing page. */
export const campaignClosedGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(CampaignGateService).isClosedNow().pipe(map((closed) => (closed ? true : router.createUrlTree(['/home']))));
};
