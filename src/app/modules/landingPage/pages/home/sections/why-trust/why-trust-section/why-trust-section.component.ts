import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FirebaseService } from 'src/app/modules/services/firebase.service';

type TrustStory = {
  title: string;
  bodyLines: string[];
  partners?: {
    name: string;
    image: string;
    imageAlt: string;
  }[];
  image: string;
  imageAlt: string;
  mediaPosition: 'left' | 'right';
  mediaKind?: 'framed' | 'plain';
};

@Component({
  selector: 'app-why-trust-section',
  templateUrl: './why-trust-section.component.html',
  styleUrls: ['./why-trust-section.component.css']
})
export class WhyTrustSectionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private challengeDateLabel = 'قريباً';

  stories: TrustStory[] = this.buildStories();

  constructor(private readonly firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.firebaseService
      .getObject('settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: any) => {
        const startDate = this.parseDate(settings?.start_counter_date);

        if (!startDate) {
          return;
        }

        this.challengeDateLabel = this.formatShortDate(startDate);
        this.stories = this.buildStories();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildStories(): TrustStory[] {
    return [
    {
      title: 'القصة بلشت من مكان مغلوب فيه 0-10',
      bodyLines: [
        'غزة ما في استقرار ما في رأس مال ولا مقومات واضحة للحياة بس كان في شي واحد عناد إني أغيّر واقعي مهما كان الوضع'
      ],
      image: 'assets/images/anima-home/trust-gaza.webp',
      imageAlt: 'خليل يمشي في غزة',
      mediaPosition: 'left'
    },
    {
      title: 'من الصفر لأول 10000000$ خلال أول سنتين بزنس',
      bodyLines: [
        'بدأت الأونلاين بزنس في 2020 بدون خبرة خلال أول سنة وصلت لأول مليون مبيعات وبعدها اشتغلت مع أسماء قوية في المجال مثل',
        'وبنيت فريق عالمي فيه أكثر من 10000 طالب وحققت أكثر من 10000000$ مبيعات في التجارة الإلكترونية خلال سنتين وتعلمت اهم مهارات البزنس بناء الأنظمة المبيعات التسويق الإدارة'
      ],
      partners: [
        {
          name: 'Danien Feier',
          image: 'assets/images/anima-home/partners/danien-feier.jpg',
          imageAlt: 'Danien Feier'
        },
        {
          name: 'Calvin Becerra',
          image: 'assets/images/anima-home/partners/calvin-becerra.jpg',
          imageAlt: 'Calvin Becerra'
        },
        {
          name: 'Eric Worre',
          image: 'assets/images/anima-home/partners/eric-worre.jpg',
          imageAlt: 'Eric Worre'
        }
      ],
      image: 'assets/images/anima-home/trust-profit.webp',
      imageAlt: 'نتيجة أرباح بقيمة مليون دولار',
      mediaPosition: 'right'
    },
    {
      title: 'التداول كان الحبة السحرية',
      bodyLines: [
        'قررت أبدأ التداول لأنه كان بيعطيني الشي اللي كنت أحلم فيه حرية الوقت حرية المكان دخل حقيقي',
        'لكن لما دخلت لقيت عشوائية كبيرة وهون قررت أغيّر المعادلة وبنيت الـ System اللي كنت محتاجه خطوة بخطوة من الصفر بدون تخمين'
      ],
      image: 'assets/images/anima-home/trust-studio.webp',
      imageAlt: 'مكتب التداول والإضاءة الحمراء',
      mediaPosition: 'left'
    },
    {
      title: 'بنينا حاضنة أحلام وأهداف الشباب Elev8 Club',
      bodyLines: [
        'بعد ما طبّقت النظام وحققت نتائج قوية قررت أنقل هذا الشي لناس أكثر من خلال بيئة صحية ومنظمة',
        'اليوم قدرنا نساعد أكثر من 50000 شاب وصبية من مختلف دول العالم يبدأوا أول دخل إلهم ويتعلموا التداول بالطريقة الصحيحة'
      ],
      image: 'assets/images/anima-home/trust-instagram.webp',
      imageAlt: 'صفحة Elev8 Club على إنستغرام',
      mediaPosition: 'right',
      mediaKind: 'plain'
    },
    {
      title: 'تحدي elev8 club',
      bodyLines: [
        'قبل عدة أشهر قدمت النسخة الأولى واللي طبقوا الخطوات قدروا يحققوا آلاف الدولارات خلال أقل من 30 يوم',
        'كررنا التجربة بالنسخة الثانية وكانت النتيجة أوضح ناس أكثر حققت نتائج حقيقية خلال أسبوع',
        `ويوم ${this.challengeDateLabel} راح أشرحلك النظام خطوة بخطوة في التحدي المباشر الجديد`
      ],
      image: 'assets/images/anima-home/trust-challenge.webp',
      imageAlt: 'تحدي Elev8 Club النسخة الثالثة',
      mediaPosition: 'left',
      mediaKind: 'plain'
    }
    ];
  }

  private parseDate(dateValue: any): number {
    if (!dateValue) return 0;

    if (typeof dateValue === 'number') {
      return dateValue < 10000000000 ? dateValue * 1000 : dateValue;
    }

    if (typeof dateValue === 'string') {
      const trimmedValue = dateValue.trim();
      const numericValue = Number(trimmedValue);

      if (!Number.isNaN(numericValue)) {
        return numericValue < 10000000000 ? numericValue * 1000 : numericValue;
      }

      const timestamp = new Date(trimmedValue).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    }

    return 0;
  }

  private formatShortDate(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}
