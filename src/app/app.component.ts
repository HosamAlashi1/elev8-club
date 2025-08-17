import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { animate, style, transition, trigger, query, group } from '@angular/animations';
import { PublicService } from './modules/landingPage/services/public.service';
import * as AOS from 'aos'; 

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

  constructor(private publicService: PublicService, private router: Router) {}

  ngOnInit(): void {
    // ✅ تهيئة مكتبة AOS
    AOS.init({
      duration: 1000, // مدة الأنيميشن
      once: true,     // يشتغل مرة وحدة فقط
    });

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
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
