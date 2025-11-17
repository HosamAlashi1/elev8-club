import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from '../services/LottieOverlayService.service';
import { LandingService } from '../services/landing.service';


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
export class LandingPageComponent implements OnInit {
  currentYear: number;
  lottieConfig: LottieOverlayConfig = { visible: false, options: { path: '' } };

  // Properties for layout data
  pre: any = null;
  settings: { [key: string]: string } = {};
  showContent = false;

  constructor(
    private lottieService: LottieOverlayService,
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
  ) {
    this.lottieService.state$.subscribe(config => this.lottieConfig = config);
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    // فرض اتجاه LTR للوحة التحكم
    this.enforceDashboardDirection();

  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  /**
   * Force LTR direction for dashboard
   */
  private enforceDashboardDirection(): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    htmlElement.dir = 'ltr';
    htmlElement.lang = 'en';
    bodyElement.classList.remove('rtl-mode', 'arabic-font');
  }


  private hideInitialLoader(): void {
    const loader = document.getElementById('lottie-loader');
    if (loader) loader.style.display = 'none';
  }
}
