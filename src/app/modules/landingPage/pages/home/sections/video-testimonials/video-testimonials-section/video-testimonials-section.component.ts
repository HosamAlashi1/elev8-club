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
      badge: 'فديوهات',
      name: 'أنصار من فلسطين',
      amount: '+$1,000',
      description: 'كانت تشتغل بالمجال التسويقي… وخلال 6 أيام فقط قدرت تحقق +1,000$ للدرجة إنها قررت تترك شغلها بالكامل وتكمل بالتداول.',
      image: 'assets/images/canva/video-proof-massy.png'
    },
    {
      badge: 'فديوهات',
      name: 'مشترك من مصر',
      amount: '+$800',
      description: 'بدأ بدون خبرة وبرأس مال بسيط، وخلال أسبوع واحد قدر يحقق أولى نتائجه الحقيقية بالتداول.',
      image: 'assets/images/canva/video-proof-salah.png'
    }
  ];
}
