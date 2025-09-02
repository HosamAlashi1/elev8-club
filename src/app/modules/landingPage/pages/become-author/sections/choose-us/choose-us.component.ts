import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-choose-us',
  templateUrl: './choose-us.component.html',
  styleUrls: ['./choose-us.component.css']
})
export class ChooseUsComponent {
  @Input() title!: string;
  @Input() items: { icon: string; title: string; desc: string }[] = [];
}
