import { Component, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  animations: [
    trigger('slideToggle', [
      state('closed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        paddingTop: '0px',
        paddingBottom: '0px',
        marginTop: '0px'
      })),
      state('open', style({
        height: '*',
        opacity: 1,
        overflow: 'visible',
        paddingTop: '*',
        paddingBottom: '*',
        marginTop: '*'
      })),
      transition('closed => open', [
        animate('300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ]),
      transition('open => closed', [
        animate('250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ])
    ])
  ]
})
export class FaqComponent {
  @Input() title!: string;
  @Input() items: { q: string; a: string }[] = [];
  openIndex: number | null = null;

  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }
}
