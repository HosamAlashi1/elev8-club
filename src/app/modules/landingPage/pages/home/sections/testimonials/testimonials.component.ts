import { Component, AfterViewInit, Input } from '@angular/core';
import { Testimonial } from '../../../../../services/landing.service';

declare const AOS: any;

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent implements AfterViewInit {
  @Input() title: string = 'What People Say';
  @Input() testimonials: Testimonial[] = [];

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }

  getStars(rating: number): Array<number> {
    return Array(rating).fill(0);
  }
}
