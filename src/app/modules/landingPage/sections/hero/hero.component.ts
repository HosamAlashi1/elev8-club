import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit {

  isVisible: boolean = false; // لتفعيل الأنيميشن

  ngOnInit(): void {
    // نستخدم تايمر بسيط علشان نعمل تأخير قبل ظهور المحتوى
    setTimeout(() => {
      this.isVisible = true;
    }, 200);
  }
}
