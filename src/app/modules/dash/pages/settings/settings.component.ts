import { Component, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  animations: [
    trigger('tabSlide', [
      transition('* => *', [
        query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),

        group([
          query(':leave', [
            animate('300ms ease', style({ transform: 'translateX(-100%)', opacity: 0 }))
          ], { optional: true }),

          query(':enter', [
            style({ transform: 'translateX(100%)', opacity: 0 }),
            animate('300ms ease', style({ transform: 'translateX(0)', opacity: 1 }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class SettingsComponent implements AfterViewInit {
  activeTab: string = 'store-info';

  // underline control
  @ViewChildren('tabBtn', { read: ElementRef }) tabBtns!: QueryList<ElementRef>;
  underlineLeft = 0;
  underlineWidth = 0;

  ngAfterViewInit() {
    this.moveUnderline();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.moveUnderline();
  }

  private moveUnderline() {
    setTimeout(() => {
      const activeEl = this.tabBtns.find(el =>
        el.nativeElement.classList.contains('active')
      );
      if (activeEl) {
        this.underlineLeft = activeEl.nativeElement.offsetLeft;
        this.underlineWidth = activeEl.nativeElement.offsetWidth;
      }
    });
  }
}
