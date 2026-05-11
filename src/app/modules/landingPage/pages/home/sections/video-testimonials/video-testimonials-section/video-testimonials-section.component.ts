import { Component, Input } from '@angular/core';

interface ProofStory {
  badge: string;
  name: string;
  amount: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-video-testimonials-section',
  templateUrl: './video-testimonials-section.component.html',
  styleUrls: ['./video-testimonials-section.component.css']
})
export class VideoTestimonialsSectionComponent {
  @Input() onOpenRegistration!: () => void;

  stories: ProofStory[] = [
    {
      badge: 'فيديوهات',
      name: 'زادة',
      amount: '$120,000+',
      description: 'قدرت تحقق أكثر من 120,000$ بينما كانت بنفس الوقت تعتني بطفلين.',
      image: 'assets/images/canva/video-proof-massy.png'
    },
    {
      badge: 'نتيجة موثقة',
      name: 'أرماندو',
      amount: '$111,000+',
      description: 'شاب عمره 19 سنة من عائلة مهاجرة بسيطة، وحقق أكثر من 111,000$ واشترى لنفسه سيارة McLaren.',
      image: 'assets/images/canva/video-proof-salah.png'
    }
  ];
}
