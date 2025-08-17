import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  scrolled = false;
  isCollapsed = true; // افتراضياً مغلقة على الموبايل
  activeSection: 'about' | 'how-it-works' | 'features' | 'contact' | '' = '';
  private io?: IntersectionObserver;

  ngOnInit(): void {
    this.onScroll();

    const ids = ['about', 'how-it-works', 'features', 'contact'];
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
    const el = document.getElementById(id);
    if (!el) return;

    const nav = document.querySelector('.lp-navbar') as HTMLElement | null;
    const offset = (nav?.offsetHeight ?? 64) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: 'smooth' });

    // انهِ تأثير الـ focus على اللينك
    (ev?.currentTarget as HTMLElement | null)?.blur();

    // سكّر القائمة على الموبايل
    this.isCollapsed = true;
  }
}
