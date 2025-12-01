import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from '../services/LottieOverlayService.service';
import { LandingService } from '../services/landing.service';
import { MetaPixelService } from '../services/meta-pixel.service';

import { filter } from 'rxjs/operators';

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

  pre: any = null;
  settings: { [key: string]: string } = {};
  showContent = false;

  constructor(
    private lottieService: LottieOverlayService,
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
    private router: Router,
    private metaPixel: MetaPixelService,
  ) {
    this.lottieService.state$.subscribe(config => this.lottieConfig = config);
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    this.enforceDashboardDirection();

    // تتبّع الصفحات داخل اللاندينج فقط
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        // Stage 1: PageView رسمي
        this.metaPixel.trackPageView(url);

        // Stage 2: ViewContent - الصفحة الأولى (الخطوة 1)
        if (url.includes('/home')) {
          this.metaPixel.trackViewContent(1, 'landing_step_1', { page_name: 'Home' });
        }

        // Stage 2: ViewContent - الصفحة الثانية (الخطوة 2)
        if (url.includes('/video-questions')) {
          this.metaPixel.trackViewContent(2, 'landing_step_2', { page_name: 'Video Questions' });
        }
      });
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  private enforceDashboardDirection(): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    htmlElement.dir = 'ltr';
    htmlElement.lang = 'en';
    bodyElement.classList.remove('rtl-mode', 'arabic-font');
  }
}
