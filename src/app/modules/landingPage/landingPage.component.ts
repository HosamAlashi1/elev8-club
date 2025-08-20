import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { AnimationOptions } from 'ngx-lottie';
import { LandingService, LandingPageData, AppPreview, Feature, Process, Testimonial } from '../services/landing.service';
import { ToastrService } from 'ngx-toastr';
import { timeout, catchError, of, Subscription, finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './landingPage.component.html',
  styleUrls: ['./landingPage.component.css'],
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
export class LandingPageComponent implements OnInit, OnDestroy {
  currentYear: number;
  
  // بيانات API
  landingData: LandingPageData | null = null;
  settings: { [key: string]: string } = {};
  
  // للانيميشنز
  isDataLoaded = false;
  animationState = 'initial';
  showContent = false;
  
  // للـ debugging
  private subscription: Subscription = new Subscription();
  private debugTimer: any;
  
  constructor(
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
    private toastr: ToastrService
  ) {
    this.currentYear = new Date().getFullYear();
    console.log('🚀 LandingPageComponent constructor called');
  }

  ngOnInit(): void {
    console.log('🔄 ngOnInit called - starting data load');
    
    // إعداد الحالة الأولية
    this.showContent = false;
    this.isDataLoaded = false;
    
    // تحميل البيانات التجريبية أولاً لضمان ظهور المحتوى
    this.loadFallbackData();
    // ثم محاولة تحميل البيانات الحقيقية
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    console.log('🧹 Component destroyed - cleaning up subscriptions');
    this.subscription.unsubscribe();
    if (this.debugTimer) {
      clearTimeout(this.debugTimer);
    }
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
   * جلب بيانات الصفحة الرئيسية
   */
  loadHomeData(): void {
    console.log('📡 Starting API call...');
    
    // Timer للـ debugging - إذا ما تم تحميل البيانات خلال 10 ثواني
    this.debugTimer = setTimeout(() => {
      console.log('⚠️  API call taking too long - possible hang detected');
      this.toastr.warning('API call is taking longer than expected');
    }, 10000);
    
    const apiCall = this.landingService.getHomeData()
      .pipe(
        timeout(15000), // مهلة 15 ثانية
        catchError((error) => {
          console.error('❌ API Error:', error);
          return of({
            status: false,
            data: null,
            message: 'Failed to load data'
          });
        }),
        finalize(() => {
          console.log('🏁 API call completed (success or error)');
          if (this.debugTimer) {
            clearTimeout(this.debugTimer);
          }
        })
      );

    this.subscription.add(
      apiCall.subscribe({
        next: (response) => {
          console.log('✅ API Response received:', response);
          
          if (response.status && response.data) {
            // تحضير البيانات تدريجياً لتجنب التعليق
            console.log('📊 Processing response data...');
            
            // إخفاء المحتوى مؤقتاً للانيميشن الناعم
            this.showContent = false;
            this.cd.detectChanges();
            
            // انتظار قصير ثم تحديث البيانات
            setTimeout(() => {
              // تحديد البيانات بشكل آمن
              this.landingData = {
                app_previews: response.data.app_previews || [],
                features: (response.data.features || []).slice(0, 10), // تحديد عدد العناصر
                processes: (response.data.processes || []).slice(0, 10),
                testimonials: (response.data.testimonials || []).slice(0, 10),
                settings: response.data.settings || { '': [] }
              };
              
              console.log('📊 Settings before parse:', response.data.settings);
              
              // التحقق من وجود البيانات والمعالجة الآمنة
              if (response.data.settings && response.data.settings[''] && Array.isArray(response.data.settings[''])) {
                try {
                  this.settings = this.landingService.parseSettings(response.data.settings['']);
                  console.log('⚙️  Parsed settings:', Object.keys(this.settings).length, 'settings found');
                } catch (error) {
                  console.error('❌ Error parsing settings:', error);
                  this.settings = {};
                }
              } else {
                console.warn('⚠️  No valid settings array found in response');
                this.settings = {};
              }
              
              console.log('✨ Data loaded successfully');
              
              // عرض المحتوى الجديد مع انيميشن
              this.showContent = true;
              this.isDataLoaded = true;
              this.animationState = 'updated';
              
              // إجبار إعادة رسم الواجهة بعد تحديث البيانات
              this.cd.detectChanges();
            }, 150);
          } else {
            console.warn('⚠️  Invalid response format:', response);
            this.toastr.error('Failed to load page data');
          }
          
          // إخفاء لودر الـ index فقط
          this.hideInitialLoader();
          console.log('🔄 Data processing completed');
        },
        error: (error) => {
          console.error('💥 Subscription error:', error);
          this.toastr.error('Error loading page data');
          // إخفاء لودر حتى لو حدث خطأ
          this.hideInitialLoader();
        }
      })
    );
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

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  /**
   * تحميل بيانات تجريبية للاختبار
   */
  loadFallbackData(): void {
    console.log('🎭 Loading fallback demo data');
    
    // إخفاء المحتوى مؤقتاً للانيميشن
    this.showContent = false;
    
    this.settings = {
      'hero_title': 'Early Detection Saves Lives',
      'hero_desc': 'Test for kidney disease easily from home with AI-powered results.',
      'hero_learn_more_link': '#',
      'link_ios_app': 'https://apps.apple.com',
      'link_android_app': 'https://play.google.com',
      'solution_title': 'Revolutionary Home Testing Solution',
      'solution_desc': 'Our AI-powered system combines convenience with medical expertise.',
      'solution_image': 'assets/img/testing.jpg',
      'heroImage': 'assets/images/hero-image.png',
      'solution_list_first': 'Professional-grade testing kits',
      'solution_list_second': 'Instant AI analysis',
      'solution_list_third': 'Direct connection with medical centers',
      'solution_list_forth': 'Secure and private results',
      'process_title': 'Simple 4-Step Process',
      'features_title': 'Key Features',
      'app_preview_title': 'App Previews',
      'testimonial_title': 'What People Say',
      'get_started_title': 'Get Started Today',
      'get_started_QR_code_image': 'assets/img/QR.svg',
      'contact_us_title': 'Contact Us',
      'footer_title': 'Making kidney disease detection accessible and convenient for everyone.',
      'tests_completed': '10,000+',
      'medical_centers': '500+',
      'accuracy_rate': '99.9%',
      'customer_support': '24/7',
      'phone': '+1 (555) 123-4567',
      'email': 'contact@kidneytest.com',
      'address': '123 Medical Center Drive, Healthcare City, HC 12345',
      'facebook': 'https://www.facebook.com/',
      'twitter': 'https://www.twitter.com/',
      'instagram': 'https://www.instagram.com/',
      'linkedin': 'https://www.linkedin.com/'
    };

    this.landingData = {
      app_previews: [
        { id: 1, image: 'assets/img/app 1.svg' },
        { id: 2, image: 'assets/img/app 2.svg' },
        { id: 3, image: 'assets/img/app 3.svg' },
        { id: 4, image: 'assets/img/app 4.svg' }
      ],
      features: [
        { id: 1, title: 'AI-Powered Diagnosis', image: 'assets/img/feature 1.svg', description: 'Advanced machine learning algorithms for accurate results' },
        { id: 2, title: 'Mobile App Integration', image: 'assets/img/feature 2.svg', description: 'iOS and Android compatible with easy-to-use interface' },
        { id: 3, title: 'Medical Center Network', image: 'assets/img/feature 3.svg', description: 'Connected with certified healthcare providers' }
      ],
      processes: [
        { id: 1, step: '1', title: 'Order Testing Kit', description: 'Purchase your home testing kit through our app' },
        { id: 2, step: '2', title: 'Follow Instructions', description: 'Use the kit and capture images in the app' },
        { id: 3, step: '3', title: 'AI Analysis', description: 'Our AI system analyzes your test results' },
        { id: 4, step: '4', title: 'Get Results', description: 'Receive instant results and recommendations' }
      ],
      testimonials: [
        { id: 1, name: 'Dr. Sarah Johnson', position: 'Nephrologist', image: 'assets/img/person 1.png', rating: 5, testimonial: 'A game-changing solution for early kidney disease detection.' },
        { id: 2, name: 'Michael Chen', position: 'Patient', image: 'assets/img/person 2.png', rating: 5, testimonial: 'The app made home testing so simple and convenient.' }
      ],
      settings: { '': [] }
    };

    console.log('✅ Fallback data loaded successfully');
    
    // عرض المحتوى مع انيميشن بسيط
    setTimeout(() => {
      this.showContent = true;
      this.animationState = 'loaded';
      this.cd.detectChanges();
    }, 100);
  }
}
