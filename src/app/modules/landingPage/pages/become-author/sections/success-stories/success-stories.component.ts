import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-success-stories',
  templateUrl: './success-stories.component.html',
  styleUrls: ['./success-stories.component.css']
})
export class SuccessStoriesComponent {
  @Input() title!: string;
  @Input() stories: { name: string; role?: string; quote: string; avatar?: string }[] = [];
}
