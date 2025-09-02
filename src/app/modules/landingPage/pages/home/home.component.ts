import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { LandingService, LandingPageData } from '../../../services/landing.service';
import { AppInitializerService } from '../../../../core/services/app-initializer.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Transition ناعم بين المقاطع
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  // الداتا الخام القادمة من AppInitializer (بناءً على الهيكل الجديد)
  pre: any = null;

  // لو حبيت تبقي على LandingPageData لأسباب لاحقة – غير مستخدمة في التمبلت الحالي
  landingData: LandingPageData | null = null;

  // الإعدادات (عناوين السكاشن + تواصل + سوشيال)
  settings: { [key: string]: string } = {};

  showContent = false;

  constructor(
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
    private appInitializer: AppInitializerService
  ) {}

  ngOnInit(): void {
    // إخفاء اللودر (إن وجد في index)
    this.hideInitialLoader();

    // تحميل الداتا المحمّلة مسبقاً من APP_INITIALIZER
    this.loadPreloadedData();
  }

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  private hideInitialLoader(): void {
    const loader = document.getElementById('lottie-loader');
    if (loader) loader.style.display = 'none';
  }

  // قراءة الداتا من APP_INITIALIZER + تحويل settings إلى object
  private loadPreloadedData(): void {
    const preloaded = this.appInitializer.getPreloadedData();

    if (!preloaded) {
      // حد أدنى من القيم لو لا يوجد أي داتا
      this.settings = {
        'hero_title': 'Discover Your Next Literary Adventure',
        'hero_desc': 'Curated collection of finest literature',
        'contact_us_title': 'Contact Us',
        'footer_title': 'America’s Oldest Publishing Services Company — Trusted for 100+ Years.'
      };
      this.pre = { hero: {}, navbar: {}, introTrust: [], featuredBooks: [], categories: [], bestsellingBooks: [], staffPicks: {}, awardWinners: {}, testimonials: [], blogs: [] };
      this.showContent = true;
      this.cd.detectChanges();
      return;
    }

    // احتفظ بالداتا الجديدة كما هي
    this.pre = preloaded;

    // settings في AppInitializer مخزّنة كآراي داخل المفتاح '' – نحولها لأوبجكت
    if (preloaded.settings && preloaded.settings[''] && Array.isArray(preloaded.settings[''])) {
      this.settings = this.landingService.parseSettings(preloaded.settings['']);
    } else {
      this.settings = {};
    }

    this.showContent = true;
    this.cd.detectChanges();
  }

  // للـ Router outlet animation إن احتجته
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
