import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-past-events',
  templateUrl: './past-events.component.html',
  styleUrls: ['./past-events.component.css']
})
export class PastEventsComponent {
  @Input() sectionTitle!: string;   // عنوان السكشن
  @Input() events: any[] = [];      // لستة الأحداث الماضية
}
