import { Component, Input } from '@angular/core';

export interface BookItem {
  img: string;
  title: string;
  author?: string;
  price?: string;
  rating?: number;
  alt?: string;
}

@Component({
  selector: 'app-award-winners',
  templateUrl: './award-winners.component.html',
  styleUrls: ['./award-winners.component.css']
})
export class AwardWinnersComponent {
  @Input() title: string = 'Recent Award Winners';
  @Input() firstRow: BookItem[] = [];
  @Input() secondRow: BookItem[] = [];
}
