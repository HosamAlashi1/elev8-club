import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PublicService } from '../../../services/public.service';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any = {};
  isCollapsed = false;
  isMobile = false;
  unreadContactMessagesCount = 0;
  unreadOrdersCount = 0;
  private countUpdateInterval: any;

  menu: any[] = [
    { label: 'Home', icon: 'home', route: '/dashboard' },
    { label: 'Admins', icon: 'shield-check', route: '/dashboard/admins' },
    { label: 'Orders', icon: 'shopping-cart', route: '/dashboard/orders' },
    { label: 'Tutorial', icon: 'book-open', route: '/dashboard/tutorial' },
    { label: 'Packages', icon: 'package', route: '/dashboard/packages' },
    { label: 'Package Features', icon: 'list-checks', route: '/dashboard/package-features' },
    { label: 'Payment Methods', icon: 'credit-card', route: '/dashboard/payment-methods' },
    { label: 'App Previews', icon: 'monitor-smartphone', route: '/dashboard/app-preview' },
    { label: 'Features', icon: 'layers', route: '/dashboard/features' },
    { label: 'Processes', icon: 'workflow', route: '/dashboard/processes' },
    { label: 'Testimonials', icon: 'message-square', route: '/dashboard/testimonials' },
    { label: 'Contacts Messages', icon: 'inbox', route: '/dashboard/contact-messages' },
    { label: 'Settings', icon: 'settings', route: '/dashboard/settings' }
  ];


  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    public publicService: PublicService,
    private router: Router,
    private httpService: HttpService,
    private api: ApiService
  ) { }

  ngOnInit(): void {
    this.onResize();
    this.user = this.publicService.getUserData();
    this.getUnreadContactMessagesCount();
    this.getUnreadOrdersCount();

    // تحديث العداد كل 30 ثانية
    this.countUpdateInterval = setInterval(() => {
      this.getUnreadContactMessagesCount();
      this.getUnreadOrdersCount();
    }, 30000);

    // استمع لتغيير التنقل واضبط القائمة تلقائيًا
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.menu.forEach(item => {
        // أغلق جميع القوائم الفرعية
        item.open = false;

        // افتح القائمة المناسبة إذا كانت تحتوي على الراوت الحالي
        if (item.children) {
          item.open = item.children.some((sub: any) => this.router.url.includes(sub.route));
        }
      });

      // إذا كنا في موبايل، أغلق السايدبار تلقائيًا بعد أي تنقل
      if (this.isMobile && !this.isCollapsed) {
        this.toggleSidebar();
      }
    });
  }


  /** مراقبة تغيير حجم الشاشة لتحديد إذا كان الجهاز موبايل */
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 768;

    if (this.isMobile && !this.isCollapsed) {
      this.toggleSidebar();
    }
  }

  /** عرض مودال صغير */
  openSm(content: any): void {
    this.modalService.open(content, { centered: true });
  }

  /** تسجيل الخروج */
  logout(): void {
    this.authService.logout();
  }

  /** تبديل حالة السايدبار */
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    document.body.classList.toggle('collapsed', this.isCollapsed);

    // أغلق جميع القوائم الفرعية عند الإغلاق
    if (this.isCollapsed) {
      this.menu.forEach(item => {
        if (item.children) item.open = false;
      });
    }
  }

  /** عند الضغط على عنصر فيه children */
  handleClick(item: any): void {

    // إذا كان الرابط هو رسائل الاتصال، قم بتعليم جميع الرسائل كمقروئة
    if (item.route === '/dashboard/contact-messages') {
      this.markAllContactMessagesAsRead();
    }

    // إذا كان الرابط هو الطلبات، قم بتعليم جميع الطلبات كمقروئة
    if (item.route === '/dashboard/orders') {
      this.markAllOrdersAsRead();
    }

    if (item.children) {
      if (this.isCollapsed) {
        this.toggleSidebar();
        setTimeout(() => this.toggleSub(item), 300);
      } else {
        this.toggleSub(item);
      }
    } else {
      // إغلاق السايدبار إذا موبايل وتم اختيار عنصر
      if (this.isMobile && !this.isCollapsed) {
        this.toggleSidebar();
      }
    }
  }



  /** تبديل القائمة الفرعية مع إغلاق غيرها */
  toggleSub(item: any): void {
    item.open = !item.open;

    this.menu.forEach(i => {
      if (i !== item && i.children) {
        i.open = false;
      }
    });
  }

  /** التحقق إذا كان العنصر هو رسائل الاتصال لإظهار العدد */
  isContactMessagesItem(item: any): boolean {
    return item.route === '/dashboard/contact-messages';
  }

  /** التحقق إذا كان العنصر هو الطلبات لإظهار العدد */
  isOrdersItem(item: any): boolean {
    return item.route === '/dashboard/orders';
  }

  /** تعليم جميع رسائل الاتصال كمقروئة عند الضغط على رابط رسائل الاتصال */
  markAllContactMessagesAsRead(): void {
    const url = `${this.api.contactMessages.markAllRead}`;
    this.httpService.action(url, {}, 'markAllContactMessagesReadFromSidebar').subscribe({
      next: (res: any) => {
        // تم تعليم جميع رسائل الاتصال كمقروئة بصمت
        this.unreadContactMessagesCount = 0; // إخفاء العدد
      },
      error: () => {
        // يمكن إضافة معالجة للأخطاء هنا إذا لزم الأمر
      }
    });
  }

  /** جلب عدد رسائل الاتصال غير المقروئة */
  getUnreadContactMessagesCount(): void {
    const url = `${this.api.contactMessages.unreadCount}`;
    this.httpService.listGet(url, 'unreadContactMessagesCountSidebar').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          this.unreadContactMessagesCount = res.data.unread_count;
        }
      },
      error: () => {
        console.error('Failed to get unread contact messages count');
      }
    });
  }

  /** تعليم جميع الطلبات كمقروئة عند الضغط على رابط الطلبات */
  markAllOrdersAsRead(): void {
    const url = `${this.api.orders.markAllRead}`;
    this.httpService.action(url, {}, 'markAllOrdersReadFromSidebar').subscribe({
      next: (res: any) => {
        // تم تعليم جميع الطلبات كمقروئة بصمت
        this.unreadOrdersCount = 0; // إخفاء العدد
      },
      error: () => {
        // يمكن إضافة معالجة للأخطاء هنا إذا لزم الأمر
      }
    });
  }

  /** جلب عدد الطلبات غير المقروءة */
  getUnreadOrdersCount(): void {
    const url = `${this.api.orders.unreadCount}`;
    this.httpService.listGet(url, 'unreadOrdersCountSidebar').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          this.unreadOrdersCount = res.data.unread_count;
        }
      },
      error: () => {
        console.error('Failed to get unread orders count');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.countUpdateInterval) {
      clearInterval(this.countUpdateInterval);
    }
  }
}
