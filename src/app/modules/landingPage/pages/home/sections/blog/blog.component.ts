import { Component, Input } from '@angular/core';

export interface BlogItem {
  img: string;
  title: string;
  description: string;
  link?: string;
  date?: string;
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {
  @Input() title: string = 'Latest From Our Blog';
  @Input() items: BlogItem[] = [];
}
