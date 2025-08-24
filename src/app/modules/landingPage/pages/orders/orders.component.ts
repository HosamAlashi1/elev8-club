import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LandingService, LandingPageData } from '../../../services/landing.service';
import { AppInitializerService } from '../../../../core/services/app-initializer.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  activeStep: number = 1;
  allowBackNavigation: boolean = true;


  steps = [
    { index: 1, label: 'Cart', route: '/orders/cart' },
    { index: 2, label: 'Details', route: '/orders/details' },
    { index: 3, label: 'Payment', route: '/orders/payment' },
    { index: 4, label: 'Confirmation', route: '/orders/confirmation' },
  ];

  landingData: LandingPageData | null = null;
  settings: { [key: string]: string } = {};
  showContent = false;

  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private landingService: LandingService,
    private appInitializer: AppInitializerService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // تحديث الـ stepper عند التنقل
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveStep(event.urlAfterRedirects);
      });

    // أول مرة / ريفرش
    this.updateActiveStep(this.router.url);

    // تحميل البيانات المحمّلة مسبقاً
    this.loadPreloadedData();
  }

  ngOnDestroy(): void {
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  updateActiveStep(url: string) {
    const step = this.steps.find(s => url.includes(s.route.replace('/orders', '')));
    if (step) {
      this.activeStep = step.index;
    }

    // 👇 نقرأ الـ status من الكويري عشان نقرر إذا success أو error
    const tree = this.router.parseUrl(url);
    const status = tree.queryParams['status'];

    // ✅ لو success → منع الرجوع للستيبس
    if (status === 'success') {
      this.allowBackNavigation = false;
    } else {
      this.allowBackNavigation = true;
    }
  }


  // 👈 التنقل للخطوات السابقة فقط مع شرط السماح
  goToStep(step: any) {
    if (!this.allowBackNavigation) return; // 🚫 ما يرجع أبداً لو success
    if (step.index >= this.activeStep) return; // 🚫 ما يروح لقدّام
    this.router.navigate([step.route]);
  }

  private loadPreloadedData(): void {
    const preloadedData = this.appInitializer.getPreloadedData();

    if (preloadedData) {
      this.landingData = {
        app_previews: preloadedData.app_previews || [],
        features: preloadedData.features || [],
        processes: preloadedData.processes || [],
        testimonials: preloadedData.testimonials || [],
        settings: preloadedData.settings || { '': [] }
      };

      if (preloadedData.settings && preloadedData.settings['']) {
        try {
          this.settings = this.landingService.parseSettings(preloadedData.settings['']);
        } catch (error) {
          console.error('Error parsing settings in OrdersComponent:', error);
          this.settings = {};
        }
      }
      this.showContent = true;
      this.cd.detectChanges();
    }
  }
}
