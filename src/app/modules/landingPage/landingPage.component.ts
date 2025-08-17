import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LottieOverlayService, LottieOverlayConfig } from './services/LottieOverlayService.service';


@Component({
  selector: 'app-root',
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
export class LandingPageComponent {
  currentYear: number;
   lottieConfig: LottieOverlayConfig = { visible: false, options: { path: '' } };

  constructor(private lottieService: LottieOverlayService, private cd: ChangeDetectorRef) {
    this.lottieService.state$.subscribe(config => this.lottieConfig = config);
    this.currentYear = new Date().getFullYear();
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges(); 
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
