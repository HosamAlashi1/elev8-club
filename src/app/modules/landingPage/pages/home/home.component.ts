import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
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

  // Trading Animation Data
  candlesticks: Array<{position: number, delay: number, bullish: boolean}> = [];
  priceParticles: Array<{x: number, y: number, delay: number, value: string, isProfit: boolean}> = [];
  volumeBars: Array<{position: number, height: number, delay: number, isHigh: boolean}> = [];
  marketTickers: Array<{symbol: string, price: string, change: number}> = [];
  buyOrders: Array<{width: number, delay: number}> = [];
  sellOrders: Array<{width: number, delay: number}> = [];
  buySignals: Array<{x: number, y: number, delay: number}> = [];
  sellSignals: Array<{x: number, y: number, delay: number}> = [];
  
  private animationInterval: any;
  
  // لحفظ ref code
  affiliateCode: string | null = null;

  constructor(
    private cd: ChangeDetectorRef,
    private landingService: LandingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // قراءة ref code من الـ URL
    this.route.queryParams.subscribe(params => {
      this.affiliateCode = params['ref'] || null;
      // حفظ الكود في localStorage للحفاظ عليه
      if (this.affiliateCode) {
        localStorage.setItem('affiliateCode', this.affiliateCode);
      }
    });

    // إخفاء اللودر (إن وجد في index)
    this.hideInitialLoader();
    
    // إضافة scroll effect للخلفية
    this.initScrollAnimation();
    
    // Initialize trading animations
    this.initTradingAnimations();
    this.startAnimationUpdates();
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

  ngOnDestroy(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }
  
  private initTradingAnimations(): void {
    // Generate candlesticks
    this.candlesticks = Array.from({length: 12}, (_, i) => ({
      position: 5 + (i * 7.5),
      delay: i * 0.3,
      bullish: Math.random() > 0.5
    }));
    
    // Generate price particles
    this.priceParticles = Array.from({length: 20}, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      value: Math.random() > 0.5 ? `+${(Math.random() * 5).toFixed(2)}%` : `$${(Math.random() * 1000 + 500).toFixed(0)}`,
      isProfit: Math.random() > 0.5
    }));
    
    // Generate volume bars
    this.volumeBars = Array.from({length: 30}, (_, i) => ({
      position: i * 3.3,
      height: 20 + Math.random() * 60,
      delay: i * 0.1,
      isHigh: Math.random() > 0.6
    }));
    
    // Market tickers
    this.marketTickers = [
      {symbol: 'BTC/USD', price: '$42,150', change: 2.34},
      {symbol: 'ETH/USD', price: '$3,250', change: -1.21},
      {symbol: 'GOLD', price: '$2,045', change: 0.85},
      {symbol: 'EUR/USD', price: '1.0850', change: -0.45},
      {symbol: 'S&P 500', price: '4,567', change: 1.12},
      {symbol: 'NASDAQ', price: '14,230', change: 1.85},
      {symbol: 'OIL', price: '$78.50', change: -2.10}
    ];
    
    // Order book
    this.buyOrders = Array.from({length: 8}, () => ({
      width: 30 + Math.random() * 50,
      delay: Math.random() * 2
    }));
    
    this.sellOrders = Array.from({length: 8}, () => ({
      width: 30 + Math.random() * 50,
      delay: Math.random() * 2
    }));
    
    // Trading signals
    this.buySignals = Array.from({length: 4}, () => ({
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 4
    }));
    
    this.sellSignals = Array.from({length: 4}, () => ({
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 4
    }));
  }
  
  private startAnimationUpdates(): void {
    this.animationInterval = setInterval(() => {
      // Update market tickers with random changes
      this.marketTickers = this.marketTickers.map(ticker => ({
        ...ticker,
        change: ticker.change + (Math.random() - 0.5) * 0.5
      }));
      
      this.cd.detectChanges();
    }, 3000);
  }

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
