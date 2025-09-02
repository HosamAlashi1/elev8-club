import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-upcoming-events',
  templateUrl: './upcoming-events.component.html',
  styleUrls: ['./upcoming-events.component.css']
})
export class UpcomingEventsComponent {
  @Input() sectionTitle!: string;   // عنوان السكشن
  @Input() events: any[] = [];      // لستة الأحداث القادمة
}
