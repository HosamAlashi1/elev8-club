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
      name: "مروة",
      country: "فلسطين",
      image: "assets/img/testimonials/person1.png",
      rating: 5,
      message:
        "تجربتي كانت مميزة بمجتمع Elev8 Club. مجتمع ناري وتجربة عظيمة، خصوصًا إنك تكون فايت المجال مع ناس خبرة وزي الكوتش محمد ما شاء الله بشرح بطريقة عظيمة وسلسة. من الصفر إلى 80% خلال شهر! تعلمت تحليل، مناطق دخول صحيحة، ومتى نقفل الصفقة. من 100$ إلى 524$ خلال شهر. شكراً كوتش خليل على الفرصة العظيمة."
    },

    {
      name: "وجدي",
      country: "تركيا",
      image: "assets/img/testimonials/person2.png",
      rating: 5,
      message:
        "تجربة من أحلى الفترات اللي مريت فيها. دخلت متحمس وما كنت متوقع قديش ممكن أستفيد. أول أسبوعين صعبين، بس مع الوقت فهمت السوق وصرت أتعامل مع الخسارة بوعي. اكتشفت إن التداول تفكير وصبر والتزام. الدعم ما وقف ولا لحظة. شكراً لفريق Elev8 Club على المتابعة الحقيقية وتغيير طريقة تفكيري."
    },

    {
      name: "عزّت",
      country: "فلسطين",
      image: "assets/img/testimonials/person3.png",
      rating: 5,
      message:
        "كنت داخل المجال صفر، لا تحليل ولا منصات. بس مع Elev8 Club تغيّر كل شيء. الفريق علّمنا الأساس من أول وجديد وبصبر. مش بس تعليم، دعم نفسي وتشجيع. صراحة صادقين وما وعدونا بالثراء السريع. تعلمت كيف أفكر وكيف أتحكم بعاطفتي. شكراً من القلب، أنتم غيرتوا طريقتي بالتداول."
    },

    {
      name: "هديل",
      country: "سوريا",
      image: "assets/img/testimonials/person4.png",
      rating: 5,
      message:
        "أول ما سمعت عن التداول ما كنت فاهمة شيء. حاولت أتعلم أونلاين بلا فائدة. لما شفت فرصة Elev8 Club ما توقعت تكون حقيقية. حضرت أول الجلسات مسجّل وبعدها تحمست للأونلاين. تعلمت إنه التداول تفكير ونفسية وصبر. عطيتوني معلومات ما حدا بيعطيها. صرت أحلل لحالي وأستمتع. شكراً لأنكم ما بس علمتوني التداول… علمتوني أتحكم بنفسي وبقراراتي."
    },

    {
      name: "زيد",
      country: "لبنان",
      image: "assets/img/testimonials/person5.png",
      rating: 5,
      message:
        "بلشت قبل أسبوع وشفت تقدم ممتاز. رغم إني ما لحقت كل الصفقات لكن ربحت 30%. شكراً للفريق كامل على المعلومات والدعم والتعب يلي عم تقدموه."
    },

    {
      name: "بشار",
      country: "سوريا",
      image: "assets/img/testimonials/person6.png",
      rating: 5,
      message:
        "تغيّرت نظرتي للسوق 140 درجة. صرت أعرف تحركات السوق وأخد قرارات دخول صحيحة. حضرت المحاضرات ولخصتها كلها بدفتر. دخلت صفقة واحدة وربحت 22$. شكراً لكم على كل المساعدة والدعم."
    },

    {
      name: "أحمد",
      country: "سوريا",
      image: "assets/img/testimonials/person7.png",
      rating: 5,
      message:
        "أحلى مجتمع وأفضل أسلوب تعليم مر عليّ. تبسيط المعلومة وإعطاء الزبدة بدون حكي فاضي كان شيء رهيب. شكراً على كل شيء والحماس مليون لنكمل الأسبوع."
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
