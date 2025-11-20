import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PublicService } from '../../../services/public.service';
import { HttpService } from '../../../services/http.service';
import { ApiAdminService } from '../../../services/api.admin.service';
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
    {
      label: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
    },
    {
      label: 'Affiliates',
      icon: 'users',
      route: '/dashboard/affiliates',
    },
    {
      label: 'Leads',
      icon: 'user-check',
      route: '/dashboard/leads',
    },
    // {
    //   label: 'Admins',
    //   icon: 'user-cog',
    //   route: '/dashboard/admins',
    // },
    // {
    //   label: 'Settings',
    //   icon: 'settings',
    //   route: '/dashboard/settings',
    // }
  ];

  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    public publicService: PublicService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.onResize();
    this.user = this.publicService.getUserData();

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

  onSidebarClick(event: Event): void {
    const target = event.target as HTMLElement;

    // إذا السايدبار مسكّر، والنقرة مش على أيقونة التوغل
    if (this.isCollapsed && !target.classList.contains('toggle-icon')) {
      this.toggleSidebar();
    }
  }

  /** عرض مودال صغير */
  openSm(content: any): void {
    this.modalService.open(content, { centered: true });
  }

  /** تسجيل الخروج */
  logout(): void {
    this.authService.SignOut();
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

  ngOnDestroy(): void {
    if (this.countUpdateInterval) {
      clearInterval(this.countUpdateInterval);
    }
  }
}
