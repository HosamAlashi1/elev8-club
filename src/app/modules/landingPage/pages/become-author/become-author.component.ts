import { Component } from '@angular/core';

@Component({
  selector: 'app-become-author',
  templateUrl: './become-author.component.html',
  styleUrls: ['./become-author.component.css']
})
export class BecomeAuthorComponent {

  settings: any = {
    hero_title: 'Become a Published Author',
    hero_desc: 'Receive our free 27-page Author’s Guide to bring your publishing dreams to life.',
    hero_button_text: 'Download Free Guide',
    hero_button_link: '/download/guide',

    how_title: 'How It Works',
    form_title: 'Get Your Free Guide',
    form_submit_text: 'Send Me the Guide',
    choose_title: 'Why Choose Us',
    stories_title: 'Success Stories',
    faq_title: 'Frequently Asked Questions'
  };

  pre: any = {
    hero: {
      background: 'assets/img/landing/home/hero/bg.png'
    },

    howItWorks: [
      {
        icon: 'assets/img/landing/publish-author/how-it-works/icon1.png',
        title: 'Fill Out Request',
        desc: 'Complete our simple form with your manuscript details'
      },
      {
        icon: 'assets/img/landing/publish-author/how-it-works/icon2.png',
        title: 'Receive Guide',
        desc: 'Get our comprehensive Author’s Guide via email'
      },
      {
        icon: 'assets/img/landing/publish-author/how-it-works/icon3.png',
        title: 'Learn Process',
        desc: 'Understand publishing steps and our services'
      },
      {
        icon: 'assets/img/landing/publish-author/how-it-works/icon4.png',
        title: 'Submit Manuscript',
        desc: 'Ready to publish? Submit your manuscript'
      }
    ],

    chooseUs: [
      {
        icon: 'assets/img/landing/publish-author/choose-us/icon1.png',
        title: 'Free Author’s Guide',
        desc: 'Get our comprehensive guide to publishing success'
      },
      {
        icon: 'assets/img/landing/publish-author/choose-us/icon2.png',
        title: 'Expert Support',
        desc: 'Personal guidance throughout your publishing journey'
      },
      {
        icon: 'assets/img/landing/publish-author/choose-us/icon3.png',
        title: 'Fast Publishing',
        desc: 'Quick print-on-demand listing for your book'
      },
      {
        icon: 'assets/img/landing/publish-author/choose-us/icon4.png',
        title: 'No Hidden Fees',
        desc: 'Transparent pricing and no surprises'
      },
      {
        icon: 'assets/img/landing/publish-author/choose-us/icon5.png',
        title: 'Multiple Formats',
        desc: 'Publish in eBook and paperback formats'
      },
      {
        icon: 'assets/img/landing/publish-author/choose-us/icon6.png',
        title: 'Quality Service',
        desc: 'Premium publishing quality and support'
      }
    ],

    successStories: [
      {
        name: 'Sarah Johnson',
        role: 'The Art of Mindfulness',
        quote: 'The guide made my publishing journey so much easier. Highly recommended!',
        avatar: 'assets/img/landing/publish-author/stories/person1.png'
      },
      {
        name: 'Michael Chen',
        role: 'Tech Innovation',
        quote: 'From manuscript to published book in record time. Amazing experience!',
        avatar: 'assets/img/landing/publish-author/stories/person2.png'
      },
      {
        name: 'Emily Rodriguez',
        role: 'Modern Cooking',
        quote: 'Professional service and great support throughout the process.',
        avatar: 'assets/img/landing/publish-author/stories/person3.png'
      }
    ],

    faq: [
      {
        q: 'What’s in the Author’s Guide?',
        a: 'Our comprehensive 27-page guide covers everything from manuscript preparation to marketing strategies.'
      },
      {
        q: 'Is it really free?',
        a: 'Yes, the Author’s Guide is completely free. No hidden fees or obligations.'
      },
      {
        q: 'How soon will I get it?',
        a: 'You’ll receive the guide via email within minutes of submitting your request.'
      },
      {
        q: 'What services do you offer after I’ve read the guide?',
        a: 'We offer full publishing services including editing, design, printing, and distribution.'
      }
    ]
  };
}
