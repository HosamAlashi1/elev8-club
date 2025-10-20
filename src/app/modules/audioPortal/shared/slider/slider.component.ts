import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Swiper, { Autoplay } from 'swiper';

Swiper.use([Autoplay]);

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements AfterViewInit {
  @Input() items: any[] = [];
  @Input() type: 'image' | 'card' = 'image';
  @Input() title?: string;
  @Input() direction: 'ltr' | 'rtl' = 'ltr';
  @Input() slidesPerView: number = 4;

  @ViewChild('swiperEl', { static: true }) swiperEl?: ElementRef;

  ngAfterViewInit() {
    const el = this.swiperEl?.nativeElement as any;
    if (!el) return;

    Object.assign(el, {
      direction: 'horizontal',
      breakpoints: {
        320: { slidesPerView: 1, spaceBetween: 12 },
        576: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 18 },
        1200: { slidesPerView: this.slidesPerView, spaceBetween: 20 }
      },
      loop: true,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        reverseDirection: this.direction === 'rtl' // 👈 يكفي
      },
      speed: 800
    });


    el.initialize && el.initialize();
  }


  starType(star: number, rating?: number): 'full' | 'half' | 'empty' {
    const r = Math.max(0, Math.min(5, rating ?? 0));
    if (r >= star) return 'full';
    if (r >= star - 0.5) return 'half';
    return 'empty';
  }
}
