import { Component, HostListener, OnDestroy, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() appDownloadLink: string = '#';
  @Input() iosAppLink: string = '#';
  @Input() androidAppLink: string = '#';
  
  scrolled = false;
  isCollapsed = true; // افتراضياً مغلقة على الموبايل
  activeSection: 'about' | 'how-it-works' | 'features' | 'order-demo' | 'tutorial' | 'contact' | '' = '';
  private io?: IntersectionObserver;
  private pendingScrollId: string | null = null; // 👈 نخزن السكشن المطلوب بعد التنقل

  constructor(private router: Router) {}

  get downloadLink(): string {
    if (this.appDownloadLink && this.appDownloadLink !== '#') {
      return this.appDownloadLink;
    }
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return this.iosAppLink;
    }
    if (/android/i.test(userAgent)) {
      return this.androidAppLink;
    }
    return this.androidAppLink || this.iosAppLink || '#';
  }

  ngOnInit(): void {
    this.onScroll();

    const ids = ['about', 'how-it-works', 'features', 'order-demo', 'tutorial', 'contact'];
    const sections = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    this.io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis?.target?.id) this.activeSection = vis.target.id as any;
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, .25, .5, .75, 1] }
    );
    sections.forEach(s => this.io!.observe(s));

    // 👇 اسمع للـ NavigationEnd عشان أعمل Scroll بعد ما أوصل للـ Home
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.pendingScrollId) {
        setTimeout(() => {
          this.scrollIntoView(this.pendingScrollId!);
          this.pendingScrollId = null;
        }, 200);
      }
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 12;
  }

  scrollTo(id: string, ev?: Event) {
    if (ev) ev.preventDefault();

    if (this.router.url !== '/') {
      // 👇 رجع للصفحة الرئيسية وخزن السكشن
      this.pendingScrollId = id;
      this.router.navigate(['/']);
    } else {
      // 👇 إنت بالصفحة الرئيسية، اعمل Scroll مباشرة
      this.scrollIntoView(id);
    }

    // انهِ تأثير الـ focus على اللينك
    (ev?.currentTarget as HTMLElement | null)?.blur();
    // سكّر القائمة على الموبايل
    this.isCollapsed = true;
  }

  private scrollIntoView(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const nav = document.querySelector('.lp-navbar') as HTMLElement | null;
    const offset = (nav?.offsetHeight ?? 64) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
