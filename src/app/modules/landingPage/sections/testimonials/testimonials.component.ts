import { Component, AfterViewInit } from '@angular/core';

declare const AOS: any;

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number; // 1..5
}

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent implements AfterViewInit {

  title = 'What People Say';

  testimonials: Testimonial[] = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Nephrologist',
      avatar: 'assets/img/person 1.png',
      quote: 'A game-changing solution for early kidney disease detection.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Patient',
      avatar: 'assets/img/person 2.png',
      quote: 'The app made home testing so simple and convenient.',
      rating: 5
    },
    {
      name: 'Dr. Ahmed Hassan',
      role: 'Medical Director',
      avatar: 'assets/img/person 3.png',
      quote: 'Highly accurate results with excellent customer support.',
      rating: 5
    }
  ];

  stars = Array.from({ length: 5 }, (_, i) => i + 1);

  ngAfterViewInit(): void {
    try { if (typeof AOS !== 'undefined' && AOS?.refresh) AOS.refresh(); } catch {}
  }
}
