import { Component, OnInit, Input } from '@angular/core';

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

  isVisible: boolean = false;

  ngOnInit(): void {
    console.log('🏪 Hero component initialized');
    console.log('iOS Link:', this.iosAppLink);
    console.log('Android Link:', this.androidAppLink);
    
    // تأخير قصير لبدء انيميشن الأزرار بعد العنوان والوصف
    setTimeout(() => {
      this.isVisible = true;
      console.log('🎯 Buttons should be visible now:', this.isVisible);
    }, 500);
  }
}
