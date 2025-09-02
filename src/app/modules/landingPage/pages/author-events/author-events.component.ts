import { Component } from '@angular/core';

@Component({
  selector: 'app-author-events',
  templateUrl: './author-events.component.html',
  styleUrls: ['./author-events.component.css']
})
export class AuthorEventsComponent {
  settings: any = {
    hero_title: 'Author Events',
    hero_desc: 'Join upcoming book signings, readings, and online events with your favorite authors',

    featured_event_title: 'Featured Event',
    calendar_title: 'Upcoming Events Calendar',
    upcoming_events_title: 'Upcoming Events',
    past_events_title: 'Past Events & Highlights'
  };

  pre: any = {
    featuredEvent: {
      image: 'assets/img/landing/author-events/featured.png',
      title: 'An Evening with Margaret Mitchell',
      date: 'July 15, 2024',
      time: '7:00 PM EST',
      location: "Powell's Books, Portland, OR",
      description: `Join us for an intimate evening with bestselling author Margaret Mitchell as she discusses her latest novel 'The Silent Echo'. This exclusive event includes a book signing and Q&A session.`,
      buttonText: 'Reserve Your Spot',
      buttonLink: '#'
    },

    calendarEvents: [
      '2025-07-15', // الحدث الأول (Featured Event)
      '2025-08-20', // The Art of Storytelling
      '2025-09-22', // Writing Workshop
      '2025-10-25'  // Book Launch Party
    ],

    upcomingEvents: [
      {
        image: 'assets/img/landing/author-events/upcoming1.png',
        title: 'The Art of Storytelling',
        speaker: 'Sarah Johnson',
        date: 'July 20, 2024',
        time: '6:00 PM EST',
        location: 'Main Library, Seattle',
        buttonText: 'Register Now',
        buttonLink: '#'
      },
      {
        image: 'assets/img/landing/author-events/upcoming2.png',
        title: 'Writing Workshop',
        speaker: 'Michael Chen',
        date: 'July 22, 2024',
        time: '2:00 PM EST',
        location: 'Virtual Event',
        buttonText: 'Register Now',
        buttonLink: '#'
      },
      {
        image: 'assets/img/landing/author-events/upcoming3.png',
        title: 'Book Launch Party',
        speaker: 'Emily Parker',
        date: 'July 25, 2024',
        time: '7:00 PM EST',
        location: 'Bookstore Café, NYC',
        buttonText: 'Register Now',
        buttonLink: '#'
      }
    ],

    pastEvents: [
      {
        image: 'assets/img/landing/author-events/past1.png',
        title: 'Summer Reading Series',
        description: 'A month-long celebration of summer reading with special guest authors.',
        date: 'June 2023',
        linkText: 'View Recording',
        link: '#'
      },
      {
        image: 'assets/img/landing/author-events/past2.png',
        title: "Children's Literature Festival",
        description: 'Interactive storytelling sessions and workshops for young readers.',
        date: 'May 2023',
        linkText: 'View Recording',
        link: '#'
      },
      {
        image: 'assets/img/landing/author-events/past3.png',
        title: 'Author Meet & Greet',
        description: 'Networking event featuring local and international authors.',
        date: 'April 2023',
        linkText: 'View Recording',
        link: '#'
      }
    ]
  };
}
