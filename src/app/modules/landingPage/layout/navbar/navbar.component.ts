import { Component, HostListener, OnDestroy, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { CartService } from 'src/app/modules/services/cart.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingAuthSessionService } from '../../../services/auth-session.service';
import { LandingAccountModalComponent } from '../../shared/account/landing-account-modal/landing-account-modal.component';

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

  // 🛒 Cart
  cartCount = 0;
  bumpAnim = false;
  private cartSub?: Subscription;

  // 👤 Auth state
  isLoggedIn = false;
  user: any | null = null;
  private destroy$ = new Subject<void>();

  navLinks: LinkItem[] = [
    { label: 'Home', type: 'scroll', targetId: 'home' },
    { label: 'Shop', type: 'route', route: '/shop' },
    { label: 'Featured Author', type: 'route', route: '/featured-author' },
    { label: 'Best Sellers', type: 'scroll', targetId: 'best-sellers' },
    { label: 'Author Events', type: 'route', route: '/author-events' },
    { label: 'Become a Published Author', type: 'route', route: '/become-author' },
    { label: 'Contact Us', type: 'scroll', targetId: 'contact' },
  ];

  constructor(
    private router: Router,
    private cartService: CartService,
    private modal: NgbModal,
    private session: LandingAuthSessionService
  ) { }

  ngOnInit(): void {
    this.onScroll();

    // 👁️‍🗨️ مراقبة قسم الاتصال
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

    // تأجيل Scroll بعد الانتقال
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.pendingScrollId) {
          setTimeout(() => {
            this.scrollIntoView(this.pendingScrollId!);
            this.pendingScrollId = null;
          }, 220);
        }
      });

    // 🛒 الاشتراك بالسلة
    this.cartSub = this.cartService.getCartObs().subscribe(cart => {
      const newCount = cart.lines.reduce((s, l) => s + l.qty, 0);
      if (newCount > this.cartCount) this.triggerBump();
      this.cartCount = newCount;
    });

    // 👤 الاشتراك بحالة الحساب
    this.session.auth$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.isLoggedIn = state.isLoggedIn;
      this.user = state.user;
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.cartSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
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
    const offset = (nav?.offsetHeight ?? 64) + 40;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  isActive(link: LinkItem): boolean {
    if (link.type === 'route') return this.router.url === link.route;
    if (link.type === 'scroll') return this.activeSection === link.targetId;
    return false;
  }

  // 🛒 bump animation
  private triggerBump() {
    this.bumpAnim = true;
    setTimeout(() => this.bumpAnim = false, 500);
  }

  // 👤 Account modal
  openAccountModal(initialTab: 'login' | 'signup' = 'login', ev?: Event) {
    ev?.preventDefault();
    const ref = this.modal.open(LandingAccountModalComponent, {
      centered: true,
      size: 'xl',
    });
    ref.componentInstance.defaultAuthType = 4;     // Customer
    ref.componentInstance.initialTab = initialTab; // login or signup
  }

  // ✅ دالة التنقل الذكي (يفتح المودال إذا مش مسجل)
  navigateIfLogged(target: string, event?: Event) {
    event?.preventDefault();

    if (!this.isLoggedIn) {
      this.openAccountModal('login', event);
      return;
    }

    switch (target) {
      case 'books':
        this.router.navigate(['/audio-portal/my-books']);
        break;
      case 'cart':
        this.router.navigate(['/cart']);
        break;
      case 'settings':
        this.router.navigate(['/settings']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }

    this.isCollapsed = true;
  }

  // 👤 Logout
  logout() {
    this.session.logout();
    this.router.navigate(['/']);
  }
}
