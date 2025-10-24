import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { PageFlip, FlipSetting } from 'page-flip';

@Component({
  selector: 'app-book-flip',
  template: `<div #host class="book-host"></div>`,
  styleUrls: ['./book-flip.component.css']
})
export class BookFlipComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  @Input() pages: HTMLElement[] = [];

  private flip?: PageFlip;
  private resizeHandler = () => {};

  ngAfterViewInit(): void {
    const set: Partial<FlipSetting> = {
      width: 820,
      height: 600,
      usePortrait: true,
      showCover: false,
      maxShadowOpacity: 0.35,
      mobileScrollSupport: false
    };

    this.flip = new PageFlip(this.host.nativeElement, set);

    if (this.pages?.length) {
      this.flip.loadFromHTML(this.pages);
    }

    this.resizeHandler = () => {
      if (this.flip && this.pages?.length) {
        this.flip.updateFromHtml(this.pages); // تمرير العناصر المطلوبة
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  // ✅ تحديث الصفحات عند تغيّر @Input
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pages'] && this.flip && this.pages?.length) {
      this.flip.loadFromHTML(this.pages);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }
}
