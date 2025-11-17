import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { LandingService, LandingPageData } from '../../../services/landing.service';

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
  ) {}

  ngOnInit(): void {
    // إخفاء اللودر (إن وجد في index)
    this.hideInitialLoader();
    
    // إضافة scroll effect للخلفية
    this.initScrollAnimation();
  }
  
  private initScrollAnimation(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const homeContent = document.querySelector('.home-content') as HTMLElement;
        
        if (homeContent) {
          // تغيير opacity بناءً على السكرول
          const opacity = Math.min(0.15 + (scrolled / 5000), 0.25);
          homeContent.style.setProperty('--scroll-opacity', opacity.toString());
          
          // تحريك الخلفية بناءً على السكرول
          const translateY = scrolled * 0.3;
          homeContent.style.setProperty('--scroll-translate', `${translateY}px`);
        }
      });
    }
  }

  // حالة فتح/إغلاق الـ modal
  isRegistrationPopupOpen = false;

  // فتح نافذة التسجيل
  openRegistrationPopup = () => {
    this.isRegistrationPopupOpen = true;
    this.cd.detectChanges();
  }

  // إغلاق نافذة التسجيل
  closeRegistrationPopup = () => {
    this.isRegistrationPopupOpen = false;
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  private hideInitialLoader(): void {
    const loader = document.getElementById('lottie-loader');
    if (loader) loader.style.display = 'none';
  }


  // للـ Router outlet animation إن احتجته
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
