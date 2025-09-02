import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-become-author-hero',
  templateUrl: './become-author-hero.component.html',
  styleUrls: ['./become-author-hero.component.css']
})
export class HeroBecomeAuthorComponent {
  @Input() title!: string;          // عنوان الهيرو
  @Input() subtitle!: string;       // الوصف
  @Input() buttonLink!: string;       
  @Input() buttonText: string = 'Download Free Guide';       
  @Input() background: string = 'assets/img/landing/home/hero/bg.png';     // صورة الخلفية
}
