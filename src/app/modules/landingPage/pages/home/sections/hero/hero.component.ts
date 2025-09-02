import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild , ElementRef } from '@angular/core';

export interface HeroSlide {
  img: string;
  alt?: string;
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit, OnDestroy, OnChanges {
  @Input() background: string = '';
  @Input() slides: HeroSlide[] = [];
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() buttonText?: string = 'Shop Now';
  @Input() buttonLink?: string;

  @ViewChild('heroRoot', { static: true }) heroRoot!: ElementRef<HTMLElement>;

  currentSlide = 0;
  private intervalId: number | null = null;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currentSlide = 0;
    if (this.slides?.length > 1) {
      // تأخير بسيط بعد أول رندر
      setTimeout(() => this.startAutoSlide(), 250);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slides']) {
      if (this.slides?.length > 1) {
        this.restartAutoSlide();
      } else {
        this.stopAutoSlide();
        this.currentSlide = 0;
        this.cdr.markForCheck();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private startAutoSlide(): void {
    this.stopAutoSlide(); // نظّف أي interval سابق

    const len = this.slides?.length ?? 0;
    if (len < 2) return;

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        const next = (this.currentSlide + 1) % len;

        // ارجع داخل Angular وعدّل القيمة ثم اطلب رندر
        this.ngZone.run(() => {
          this.currentSlide = next;
          // markForCheck يكفي مع OnPush، ولو بدك فوري استخدم detectChanges
          this.cdr.markForCheck();
          // أو: this.cdr.detectChanges();
        });
      }, 3500);
    });
  }

  private restartAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  private stopAutoSlide(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
