import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from '../services/LottieOverlayService.service';


@Component({
  selector: 'app-root',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ])
    ])
  ]
})
export class DashComponent implements OnInit {
  currentYear: number;
   lottieConfig: LottieOverlayConfig = { visible: false, options: { path: '' } };

  constructor(private lottieService: LottieOverlayService, private cd: ChangeDetectorRef) {
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
}
