import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { animate, style, transition, trigger, query, group } from '@angular/animations';
import { PublicService } from './modules/services/public.service';
import * as AOS from 'aos';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
        group([
          query(':leave', [
            style({ opacity: 1, transform: 'translateX(0)' }),
            animate('300ms ease-out', style({ opacity: 0, transform: 'translateX(-35px)' }))
          ], { optional: true }),
          query(':enter', [
            style({ opacity: 0, transform: 'translateX(35px)' }),
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  previousUrl: string | null = null;

  constructor(private publicService: PublicService, private router: Router) { }

  async ngOnInit(): Promise<void> {
    AOS.init({
      duration: 1000,
      once: true,
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => AOS.refreshHard(), 350);
      });

    window.addEventListener('load', () => AOS.refreshHard());

    this.publicService.onlineStatus.subscribe((isOnline) => {
      if (!isOnline) {
        this.previousUrl = this.router.url;
        this.router.navigate(['/error/503']);
      } else if (this.previousUrl) {
        this.router.navigateByUrl(this.previousUrl);
        this.previousUrl = null;
      }
    });

    // ✅ تحميل الـ CSS حسب الـ route (كما عندك)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {

        const htmlTag = document.documentElement; // <html>

        if (
          event.urlAfterRedirects.startsWith('/dashboard') ||
          event.urlAfterRedirects.startsWith('/auth') ||
          event.urlAfterRedirects.startsWith('/error')
        ) {
          // نحول للإنجليزي
          htmlTag.setAttribute('lang', 'en');
          htmlTag.setAttribute('dir', 'ltr');

          this.loadCSS('/assets/css/dashboard.css');
          this.loadCSS('/assets/css/theme.bundle.css');
          this.removeCSS('/assets/css/landingPage.css');
        } else {
          // نرجعه عربي
          htmlTag.setAttribute('lang', 'ar');
          htmlTag.setAttribute('dir', 'rtl');

          this.loadCSS('/assets/css/landingPage.css');
          this.removeCSS('/assets/css/dashboard.css');
          this.removeCSS('/assets/css/theme.bundle.css');
        }
      });

  }


  ngAfterViewInit(): void {
    document.body.classList.add('aos-loading'); // البداية
    setTimeout(() => {
      (AOS as any).init({
        duration: 800,
        once: true,
        offset: -30,
        anchorPlacement: 'top-center',
        mirror: false
      });
      document.body.classList.remove('aos-loading'); // رجّع السلوك الطبيعي
      window.dispatchEvent(new Event('scroll'));
    }, 0);
  }


  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  //  دوال لإضافة/إزالة CSS
  private loadCSS(href: string) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }

  private removeCSS(href: string) {
    const link = document.querySelector(`link[href="${href}"]`);
    if (link) {
      link.remove();
    }
  }
}
