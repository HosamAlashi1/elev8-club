import { Component, Input } from '@angular/core';

export interface BookItem {
  id: string;
  img: string;
  title: string;
  author?: string;
  price?: string;
  rating?: number;
  alt?: string;
}

export interface StaffProfile {
  img: string;
  name: string;
  position?: string;
  quote?: string;
  books?: BookItem[]; 
}

@Component({
  selector: 'app-staff-picks',
  templateUrl: './staff-picks.component.html',
  styleUrls: ['./staff-picks.component.css']
})
export class StaffPicksComponent {
  @Input() title: string = 'August Staff Picks';
  @Input() staff!: StaffProfile;
  @Input() books: BookItem[] = [];
}
