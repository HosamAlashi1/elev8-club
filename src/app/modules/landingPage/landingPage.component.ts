import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from '../services/LottieOverlayService.service';
import { LandingService } from '../services/landing.service';
import { GtmService } from '../services/gtm.service';

import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CampaignGateService } from '../services/campaign-gate.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landingPage.component.html',
  styleUrls: ['./landingPage.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ])
    ])
  ]
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private gateSub?: Subscription;
  currentYear: number;
  lottieConfig: LottieOverlayConfig = { visible: false, options: { path: '' } };

  pre: any = null;
  settings: { [key: string]: string } = {};
  showContent = false;
  showLiveRegistrations = false;

  constructor(
    private lottieService: LottieOverlayService,
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
    private router: Router,
    private gtm: GtmService,
    private gate: CampaignGateService,
  ) {
    this.lottieService.state$.subscribe(config => this.lottieConfig = config);
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    this.enforceLandingDirection();

    // Check initial route
    this.checkRoute(this.router.url);

    // The route guard decides on arrival; this keeps the decision current while the page stays open: the
    // deadline arriving moves a visitor to the closed page, and a date moved later in the dashboard brings
    // the landing page back. The video-questions page is never closed behind — it belongs to whoever registered in time.
    this.gateSub = this.gate.closed$.subscribe((closed) => {
      const path = this.router.url.split('?')[0].replace(/^\/#?/, '');
      if (closed && /^(home)?$/.test(path)) { this.router.navigate(['/closed']); }
      if (!closed && /^closed/.test(path)) { this.router.navigate(['/home']); }
    });

    // تتبّع الصفحات داخل اللاندينج فقط
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        // Check if we should show live registrations
        this.checkRoute(url);

        // Stage 1: PageView رسمي
        this.gtm.trackPageView(url);

        // Stage 2: ViewContent - الصفحة الأولى (الخطوة 1)
        if (url.includes('/home')) {
          this.gtm.trackViewContent(1, 'landing_step_1', { page_name: 'Home' });
        }

        // Stage 2: ViewContent - الصفحة الثانية (الخطوة 2)
        if (url.includes('/video-questions')) {
          this.gtm.trackViewContent(2, 'landing_step_2', { page_name: 'Video Questions' });
        }
      });
  }

  private checkRoute(url: string): void {
    // Show live registrations only on home page
    this.showLiveRegistrations = url.includes('/home');
  }

  ngOnDestroy(): void {
    this.gateSub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  private enforceLandingDirection(): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    htmlElement.dir = 'rtl';
    htmlElement.lang = 'ar';
    bodyElement.classList.add('rtl-mode', 'arabic-font');
  }
}
