import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  group
} from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from '../services/LottieOverlayService.service';
import { LandingService } from '../services/landing.service';
import { AppInitializerService } from '../../core/services/app-initializer.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './audioPortal.component.html',
  styleUrls: ['./audioPortal.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        // العناصر الداخلية فقط، بدون تغييرات على main نفسه
        group([
          query(':leave', [
            animate('300ms ease', style({
              opacity: 0,
              transform: 'translateY(10px)'
            }))
          ], { optional: true }),

          query(':enter', [
            style({
              opacity: 0,
              transform: 'translateY(10px)'
            }),
            animate('300ms ease-out', style({
              opacity: 1,
              transform: 'translateY(0)'
            }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class AudioPortalPageComponent implements OnInit {
  currentYear: number;
  lottieConfig: LottieOverlayConfig = { visible: false, options: { path: '' } };

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
    this.enforceDashboardDirection();
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

  private hideInitialLoader(): void {
    const loader = document.getElementById('lottie-loader');
    if (loader) loader.style.display = 'none';
  }
}
