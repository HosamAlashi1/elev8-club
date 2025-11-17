import { Component } from '@angular/core';

interface Social {
  icon: string;
  name: string;
  handle: string;
  link: string;
  color: string;
}

@Component({
  selector: 'app-contact-section',
  templateUrl: './contact-section.component.html',
  styleUrls: ['./contact-section.component.css']
})
export class ContactSectionComponent {

  socials: Social[] = [
    {
      icon: 'mail',
      name: 'Email',
      handle: 'info@elev8club.com',
      link: 'mailto:info@elev8club.com',
      color: '#CFAE58'
    },
    {
      icon: 'send',
      name: 'Telegram',
      handle: 'Elev8 Club',
      link: 'https://t.me/khalilalqasasia',
      color: '#0088cc'
    },
    {
      icon: 'instagram',
      name: 'Instagram',
      handle: '@_elev8club',
      link: 'https://www.instagram.com/_elev8club?igsh=MWkwZnVwam83dWl5Yg==&utm_source=qr',
      color: '#E4405F'
    }
  ];

}
