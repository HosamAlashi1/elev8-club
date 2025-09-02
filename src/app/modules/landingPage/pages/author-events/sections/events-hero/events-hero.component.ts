import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-events-hero',
  templateUrl: './events-hero.component.html',
  styleUrls: ['./events-hero.component.css']
})
export class EventsHeroComponent {
  @Input() title!: string;          // عنوان الهيرو
  @Input() subtitle!: string;       // الوصف
  @Input() background: string = 'assets/img/landing/home/hero/bg.png';     // صورة الخلفية
}
