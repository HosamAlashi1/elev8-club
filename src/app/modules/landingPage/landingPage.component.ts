import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from '../services/LottieOverlayService.service';
import { LandingService } from '../services/landing.service';
import { AppInitializerService } from '../../core/services/app-initializer.service';


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
    private appInitializer: AppInitializerService
  ) {
    this.lottieService.state$.subscribe(config => this.lottieConfig = config);
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    // فرض اتجاه LTR للوحة التحكم
    this.enforceDashboardDirection();

    // تحميل البيانات المطلوبة للـ layout
    this.loadLayoutData();
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

  /**
   * Load layout data (navbar, footer settings)
   */
  private loadLayoutData(): void {
    // إخفاء اللودر الأولي
    this.hideInitialLoader();

    const preloaded = this.appInitializer.getPreloadedData();

    if (!preloaded) {
      // fallback values
      this.settings = {
        'footer_title': 'America\'s Oldest Publishing Services Company — Trusted for 100+ Years.',
        'phone': '',
        'email': '',
        'facebook': '',
        'twitter': '',
        'instagram': '',
        'pinterest': '',
        'youtube': '',
        'tiktok': ''
      };
      this.pre = { navbar: {} };
      this.showContent = true;
      this.cd.detectChanges();
      return;
    }

    // تحميل البيانات
    this.pre = preloaded;

    // تحويل settings من array إلى object
    if (preloaded.settings && Array.isArray(preloaded.settings)) {
      this.settings = this.landingService.parseSettings(preloaded.settings);
    } else {
      this.settings = {};
    }

    this.showContent = true;
    this.cd.detectChanges();
  }

  private hideInitialLoader(): void {
    const loader = document.getElementById('lottie-loader');
    if (loader) loader.style.display = 'none';
  }
}
