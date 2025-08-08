import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  animations: [
    trigger('tabSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      // transition(':leave', [
      //   animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-30px)' }))
      // ])
    ])
  ]
})
export class SettingsComponent implements OnInit, AfterViewInit {
  @ViewChild('tabsContainer', { static: false }) tabsContainer!: ElementRef;
  
  activeTab: string = 'profile';
  underlineStyle = {
    left: '0px',
    width: '0px'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      } else {
        this.activeTab = 'profile'; // Default tab
      }
    });
  }

  ngAfterViewInit(): void {
    // Calculate underline position after view is initialized
    setTimeout(() => {
      this.updateUnderlinePosition();
    }, 100);
    
    // Also update position when tab changes from query params
    this.route.queryParams.subscribe(() => {
      setTimeout(() => {
        this.updateUnderlinePosition();
      }, 150);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    setTimeout(() => {
      this.updateUnderlinePosition();
    }, 100);
  }

  switchTab(tab: string): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      
      // Update URL with query parameter
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: tab },
        queryParamsHandling: 'merge'
      });
      
      setTimeout(() => {
        this.updateUnderlinePosition();
      }, 10);
    }
  }

  private updateUnderlinePosition(): void {
    if (!this.tabsContainer) return;

    const activeButton = this.tabsContainer.nativeElement.querySelector('.tab-btn.active');
    if (activeButton) {
      const containerRect = this.tabsContainer.nativeElement.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      const left = buttonRect.left - containerRect.left;
      const width = buttonRect.width;
      
      this.underlineStyle = {
        left: `${left}px`,
        width: `${width}px`
      };
    }
  }
}
