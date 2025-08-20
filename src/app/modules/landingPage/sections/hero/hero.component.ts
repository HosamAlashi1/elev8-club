import { Component, OnInit, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit {
  @Input() heroTitle: string = 'Early Detection Saves Lives';
  @Input() heroDescription: string = 'Test for kidney disease easily from home with AI-powered results.';
  @Input() heroImage: string = 'assets/images/hero-image.png';
  @Input() heroLearnMoreLink: string = '#';
  @Input() iosAppLink: string = '#';
  @Input() androidAppLink: string = '#';

  isVisible: boolean = false; // لتفعيل الأنيميشن

  ngOnInit(): void {
    // نستخدم تايمر بسيط علشان نعمل تأخير قبل ظهور المحتوى
    setTimeout(() => {
      this.isVisible = true;
    }, 200);
  }
}
