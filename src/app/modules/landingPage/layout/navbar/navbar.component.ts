import { Component, HostListener, OnDestroy, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CartService } from 'src/app/modules/services/cart.service'; // عدّل المسار حسب مشروعك

type LinkItem =
  | { label: string; type: 'route'; route: string }
  | { label: string; type: 'scroll'; targetId: string };

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() logoUrl: string = 'assets/img/landing/home/logo.png';
  @Input() phone: string = '(800) 123-4567';
  @Input() email: string = 'support@literaryhaven.com';
  @Input() socials: Partial<Record<'facebook' | 'twitter' | 'instagram' | 'pinterest' | 'youtube' | 'tiktok', string>> = {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    pinterest: 'https://pinterest.com',
    youtube: 'https://youtube.com',
    tiktok: 'https://tiktok.com'
  };

  scrolled = false;
  isCollapsed = true;
  activeSection: 'contact' | '' = '';
  private io?: IntersectionObserver;
  private pendingScrollId: string | null = null;

  // 🛒 خصائص السلة
  cartCount = 0;
  bumpAnim = false;
  private cartSub?: Subscription;

  navLinks: LinkItem[] = [
    { label: 'Home', type: 'scroll', targetId: 'home' },
    { label: 'Shop', type: 'route', route: '/shop' },
    { label: 'Featured Author', type: 'route', route: '/featured-author' },
    { label: 'Best Sellers', type: 'scroll', targetId: 'best-sellers' },
    { label: 'Author Events', type: 'route', route: '/author-events' },
    { label: 'Become a Published Author', type: 'route', route: '/become-author' },
    { label: 'Contact Us', type: 'scroll', targetId: 'contact' },
  ];

  constructor(private router: Router, private cartService: CartService) { }

  ngOnInit(): void {
    this.onScroll();

    // مراقبة Section contact
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      this.io = new IntersectionObserver(
        entries => {
          const vis = entries.find(e => e.isIntersecting);
          this.activeSection = vis ? 'contact' : '';
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: [0, .25, .5, .75, 1] }
      );
      this.io.observe(contactEl);
    }

    // معالجة Pending scroll
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.pendingScrollId) {
          setTimeout(() => {
            this.scrollIntoView(this.pendingScrollId!);
            this.pendingScrollId = null;
          }, 220);
        }
      });

    // 🛒 الاشتراك مع CartService
    this.cartSub = this.cartService.getCartObs().subscribe(cart => {
      const newCount = cart.lines.reduce((s, l) => s + l.qty, 0);
      if (newCount > this.cartCount) {
        this.triggerBump();
      }
      this.cartCount = newCount;
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.cartSub?.unsubscribe();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 12;
  }

  handleLinkClick(link: LinkItem, ev?: Event) {
    ev?.preventDefault();

    if (link.type === 'route') {
      this.router.navigate([link.route]);
    } else {
      if (this.router.url !== '/' && this.router.url !== '/home') {
        this.pendingScrollId = link.targetId;
        this.router.navigate(['/']);
      } else {
        this.scrollIntoView(link.targetId);
      }
    }

    (ev?.currentTarget as HTMLElement | null)?.blur();
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

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  isActive(link: LinkItem): boolean {
    if (link.type === 'route') {
      return this.router.url === link.route;
    }
    if (link.type === 'scroll') {
      return this.activeSection === link.targetId;
    }
    return false;
  }

  // 🛒 أنيميشن الـ bump
  private triggerBump() {
    this.bumpAnim = true;
    setTimeout(() => this.bumpAnim = false, 500);
  }
}
