import { Component, Input, OnInit } from '@angular/core';

interface Testimonial {
  name: string;
  country: string;
  image: string;
  rating: number;
  message: string;
}

@Component({
  selector: 'app-written-testimonials-section',
  templateUrl: './written-testimonials-section.component.html',
  styleUrls: ['./written-testimonials-section.component.css']
})
export class WrittenTestimonialsSectionComponent implements OnInit {
  @Input() onOpenRegistration!: () => void;

  currentPage: number = 0;
  itemsPerPage: number = 3;

  testimonials: Testimonial[] = [
    {
      name: "سارة العلي",
      country: "دبي، الإمارات",
      image: "assets/img/testimonials/person1.png",
      rating: 5,
      message: "التحدي كان تجربة مذهلة! تعلمت مهارات جديدة في 7 أيام فقط، والآن أحقق دخل إضافي ممتاز. شكراً لفريق العمل على الدعم المستمر."
    },
    {
      name: "أحمد محمد",
      country: "القاهرة، مصر",
      image: "assets/img/testimonials/person2.png",
      rating: 5,
      message: "صراحة ما كنت متوقع النتائج تكون بهالسرعة! البرنامج واضح ومنظم، والتطبيق العملي ساعدني أبدأ مشروعي الخاص بكل ثقة."
    },
    {
      name: "محمد الأحمد",
      country: "الرياض، السعودية",
      image: "assets/img/testimonials/person3.png",
      rating: 5,
      message: "أفضل استثمار عملته في نفسي! تعلمت كيف أبني مصدر دخل حقيقي من البيت، وكل الأدوات والموارد كانت متوفرة ومجانية."
    },
    {
      name: "ليلى حسن",
      country: "عمّان، الأردن",
      image: "assets/img/testimonials/person4.png",
      rating: 5,
      message: "كنت شاكة في البداية، بس بعد ما بدأت التحدي، اكتشفت إنو فعلاً برنامج احترافي ومدروس. النتائج كانت أكثر من توقعاتي!"
    },
    {
      name: "خالد يوسف",
      country: "أبوظبي، الإمارات",
      image: "assets/img/testimonials/person5.png",
      rating: 5,
      message: "التحدي غير حياتي تماماً! تعلمت مهارة مطلوبة في السوق، والآن عندي عملاء يدفعون مقابل خدماتي. الموضوع أسهل مما كنت أتخيل."
    },
    {
      name: "نور سمير",
      country: "بغداد، العراق",
      image: "assets/img/testimonials/person6.png",
      rating: 5,
      message: "برنامج رائع للمبتدئين! المحتوى مبسط ومفهوم، والدعم من الفريق كان ممتاز. بعد التحدي، صرت قادرة أشتغل من البيت وأحقق دخل جيد."
    }
  ];

  ngOnInit() {
    // تهيئة البيانات
  }

  get visibleTestimonials(): Testimonial[] {
    const start = this.currentPage * this.itemsPerPage;
    return this.testimonials.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.testimonials.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
