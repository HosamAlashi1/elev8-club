import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { PageFlip, FlipSetting } from 'page-flip';
import { AudioSfxService } from '../../services/audio-sfx.service';

@Component({
  selector: 'app-book-flip',
  template: `<div #host class="book-host"></div>`,
  styleUrls: ['./book-flip.component.css']
})
export class BookFlipComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  
  @Input() pages: HTMLElement[] = [];
  @Input() width = 820;
  @Input() height = 600;
  @Input() soundEnabled = true;
  
  @Output() pageChange = new EventEmitter<{ index: number; total: number }>();
  @Output() flipStart = new EventEmitter<void>();
  @Output() flipComplete = new EventEmitter<void>();

  private flip?: PageFlip;
  private resizeHandler = () => {};
  private audioSfx = inject(AudioSfxService);
  private isDragging = false;

  ngAfterViewInit(): void {
    this.initializeFlip();
  }

  private initializeFlip(): void {
    const set: Partial<FlipSetting> = {
      width: this.width,
      height: this.height,
      usePortrait: true,
      showCover: false,
      maxShadowOpacity: 0.35,
      mobileScrollSupport: false,
      drawShadow: true,
      flippingTime: 600,
      useMouseEvents: true
    };

    this.flip = new PageFlip(this.host.nativeElement, set);

    if (this.pages?.length) {
      this.flip.loadFromHTML(this.pages);
    }

    // أرسل المؤشر عند كل قلبة
    this.flip.on('flip', (e: any) => {
      if (this.soundEnabled) {
        this.audioSfx.play('flip');
      }
      this.flipComplete.emit();
      this.pageChange.emit({ 
        index: (e.data ?? 0) + 1, 
        total: this.getCount() 
      });
    });

    // عند بداية السحب
    this.flip.on('changeState', (e: any) => {
      if (e.data === 'user_fold' && !this.isDragging) {
        this.isDragging = true;
        if (this.soundEnabled) {
          this.audioSfx.play('drag');
        }
        this.flipStart.emit();
      } else if (e.data === 'read') {
        this.isDragging = false;
      }
    });

    // أول بعثة
    setTimeout(() => {
      this.pageChange.emit({ 
        index: this.getIndex(), 
        total: this.getCount() 
      });
    }, 0);

    // معالج تغيير الحجم
    this.resizeHandler = () => { 
      if (this.flip && this.pages?.length) {
        this.flip.updateFromHtml(this.pages); 
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['pages'] && this.flip && this.pages?.length) {
      this.flip.loadFromHTML(this.pages);
      this.pageChange.emit({ 
        index: this.getIndex(), 
        total: this.getCount() 
      });
    }

    if (ch['soundEnabled'] !== undefined) {
      // تحديث حالة الصوت
    }
  }

  ngOnDestroy(): void { 
    window.removeEventListener('resize', this.resizeHandler);
    if (this.flip) {
      this.flip.destroy();
    }
  }

  // واجهة عامة
  next(): void { 
    this.flip?.flipNext(); 
  }
  
  prev(): void { 
    this.flip?.flipPrev(); 
  }
  
  goTo(i: number): void { 
    this.flip?.flip(i); 
  }
  
  getIndex(): number { 
    return (this.flip?.getCurrentPageIndex() ?? 0) + 1; 
  }
  
  getCount(): number { 
    return this.flip?.getPageCount() ?? 0; 
  }

  canGoNext(): boolean {
    return this.getIndex() < this.getCount();
  }

  canGoPrev(): boolean {
    return this.getIndex() > 1;
  }
}
