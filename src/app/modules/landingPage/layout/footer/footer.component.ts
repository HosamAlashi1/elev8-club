import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],

})
export class FooterComponent {
  @Input() description: string = 'Making kidney disease detection accessible and convenient for everyone.';
  @Input() facebook: string = '#';
  @Input() twitter: string = '#';
  @Input() youtube: string = '#';
  @Input() instagram: string = '#';
  @Input() pinterest: string = '#';
  @Input() tiktok: string = '#';
  currentYear: number = new Date().getFullYear();

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  isValidLink(link: string): boolean {
    return !!(link && link.trim() !== '' && link !== '#');
  }
}
