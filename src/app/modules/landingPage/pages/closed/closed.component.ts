import { ChangeDetectionStrategy, Component } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * "REGISTRATION IS CURRENTLY CLOSED" — Figma "Closed" 420:1242 (desktop, 1728 × 952) and 420:1462
 * (mobile, 393 × 852). Shown on its own once this campaign's date has passed (CampaignGateService);
 * "JOIN THE WAITLIST" sends the visitor on (`environment.links.waitlist`, empty until the client names where it should go).
 * The same page exists in every landing project, each behind its own date.
 */
@Component({
  selector: 'app-closed',
  templateUrl: './closed.component.html',
  styleUrls: ['./closed.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedComponent {
  readonly waitlistUrl = environment.links.waitlist;
}
