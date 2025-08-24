import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LandingService, LandingPageData, AppPreview, Feature, Process, Testimonial } from '../../../services/landing.service';
import { ToastrService } from 'ngx-toastr';
import { timeout, catchError, of, Subscription, finalize } from 'rxjs';
import { AppInitializerService } from '../../../../core/services/app-initializer.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // انيميشن بسيط للـ route transitions
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ])
    ]),
    
    // انيميشن بسيط للعناصر
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    
    // انيميشن بسيط للبطاقات
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  currentYear: number;
  
  // بيانات API
  landingData: LandingPageData | null = null;
  settings: { [key: string]: string } = {};
  
  // للانيميشنز
  isDataLoaded = false;
  animationState = 'initial';
  showContent = false;
  
  constructor(
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
    private toastr: ToastrService,
    private appInitializer: AppInitializerService
  ) {
    this.currentYear = new Date().getFullYear();
    console.log('🚀 LandingPageComponent constructor called');
  }

  ngOnInit(): void {
    console.log('🔄 ngOnInit called - using preloaded data');
    
    // إخفاء لودر الـ index أولاً
    this.hideInitialLoader();
    
    // استخدام البيانات المحملة مسبقاً من APP_INITIALIZER
    this.loadPreloadedData();
  }

  ngOnDestroy(): void {
    console.log('🧹 Component destroyed - cleanup completed');
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges(); 
  }

  /**
   * إخفاء لودر الـ index عند اكتمال التحميل
   */
  private hideInitialLoader(): void {
    const loader = document.getElementById('lottie-loader');
    if (loader) {
      loader.style.display = 'none';
      console.log('🎬 Initial Lottie loader hidden');
    }
  }

  /**
   * دالة مساعدة للانيميشنز
   */
  getAnimationDelay(index: number): string {
    return `${index * 50}ms`;
  }

  /**
   * التحقق من حالة الانيميشن
   */
  shouldAnimate(): boolean {
    return this.showContent && this.landingData !== null;
  }

  /**
   * تحميل البيانات المحملة مسبقاً من APP_INITIALIZER
   */
  loadPreloadedData(): void {
    console.log('📋 Loading preloaded data from APP_INITIALIZER');
    
    const preloadedData = this.appInitializer.getPreloadedData();
    
    if (preloadedData) {
      // تحديد البيانات المحملة مسبقاً
      this.landingData = {
        app_previews: preloadedData.app_previews || [],
        features: preloadedData.features || [],
        processes: preloadedData.processes || [],
        testimonials: preloadedData.testimonials || [],
        settings: preloadedData.settings || { '': [] }
      };
      
      // معالجة الإعدادات
      if (preloadedData.settings && preloadedData.settings[''] && Array.isArray(preloadedData.settings[''])) {
        try {
          this.settings = this.landingService.parseSettings(preloadedData.settings['']);
          console.log('⚙️ Parsed preloaded settings:', Object.keys(this.settings).length, 'settings found');
        } catch (error) {
          console.error('❌ Error parsing preloaded settings:', error);
          this.settings = {};
        }
      } else {
        console.warn('⚠️ No valid settings in preloaded data');
        this.settings = {};
      }
      
      // عرض المحتوى فوراً
      this.showContent = true;
      this.isDataLoaded = true;
      this.animationState = 'loaded';
      
      console.log('✅ Preloaded data applied successfully');
      this.cd.detectChanges();
    } else {
      console.error('❌ No preloaded data available - using basic fallback');
      this.loadBasicFallback();
    }
  }

  /**
   * تحميل بيانات احتياطية أساسية في حالة فشل APP_INITIALIZER
   */
  loadBasicFallback(): void {
    console.log('� Loading basic fallback data');
    
    this.settings = {
      'hero_title': 'Early Detection Saves Lives',
      'hero_desc': 'Test for kidney disease easily from home with AI-powered results.',
      'contact_us_title': 'Contact Us',
      'footer_title': 'Making kidney disease detection accessible and convenient for everyone.'
    };

    this.landingData = {
      app_previews: [],
      features: [],
      processes: [],
      testimonials: [],
      settings: { '': [] }
    };

    this.showContent = true;
    this.isDataLoaded = true;
    this.cd.detectChanges();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
