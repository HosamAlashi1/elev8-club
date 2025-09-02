import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-featured-event',
  templateUrl: './featured-event.component.html',
  styleUrls: ['./featured-event.component.css']
})
export class FeaturedEventComponent {
  @Input() sectionTitle!: string;   // عنوان السكشن
  @Input() event: any;              // تفاصيل الحدث (صورة، عنوان، وصف...)
}
