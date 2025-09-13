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

  ngOnInit(): void {
    AOS.init({
      duration: 800,
      once: true,
      offset: 0,                     // أخّر التريغر شوي
      anchorPlacement: 'top-center',   // أدقّ من الافتراضي
      startEvent: 'load',              // بعد ما يجهز كلشي
      mirror: false
    });

    // بعد كل ناڤيجيشن + بعد انتهاء ترانزيشن الراوتر
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => AOS.refreshHard(), 350); // 300ms ترانزيشن + هامِش
      });

    // لو عندك تحميل أولي للصور/الخطوط: رجّح حسابات AOS بعد التحميل
    window.addEventListener('load', () => AOS.refreshHard());
    // ✅ كود التحقق من الاتصال
    this.publicService.onlineStatus.subscribe((isOnline) => {
      if (!isOnline) {
        this.previousUrl = this.router.url;
        this.router.navigate(['/error/503']);
      } else {
        if (this.previousUrl) {
          this.router.navigateByUrl(this.previousUrl);
          this.previousUrl = null;
        }
      }
    });

    // ✅ تحميل CSS حسب الـ route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.urlAfterRedirects.startsWith('/dashboard') || event.urlAfterRedirects.startsWith('/auth/') || event.urlAfterRedirects.startsWith('/error')) {
          this.loadCSS('/assets/css/dashboard.css');
          this.loadCSS('/assets/css/theme.bundle.css');
          this.removeCSS('/assets/css/landingPage.css');
        } else {
          this.loadCSS('/assets/css/landingPage.css');
          this.removeCSS('/assets/css/dashboard.css');
          this.removeCSS('/assets/css/theme.bundle.css');
        }
      });
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  // ✅ دوال لإضافة/إزالة CSS
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
