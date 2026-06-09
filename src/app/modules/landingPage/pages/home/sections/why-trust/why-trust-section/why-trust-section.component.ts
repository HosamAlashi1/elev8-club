import { Component } from '@angular/core';

type TrustStory = {
  title: string;
  bodyLines: string[];
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
export class WhyTrustSectionComponent {
  stories: TrustStory[] = [
    {
      title: 'القصة بلشت من مكان مغلوب فيه 0-10',
      bodyLines: [
        'غزة. ما في استقرار، ما في رأس مال، ولا مقومات واضحة للحياة، بس كان في',
        'شي واحد عناد إني أغيّر واقعي مهما كان الوضع'
      ],
      image: 'assets/images/anima-home/trust-gaza.png',
      imageAlt: 'خليل يمشي في غزة',
      mediaPosition: 'left'
    },
    {
      title: 'من الصفر لأول 10,000,000$ خلال أول سنتين بزنس',
      bodyLines: [
        'بدأت الأونلاين بزنس في 2020 بدون خبرة',
        'خلال أول سنة وصلت لأول مليون مبيعات',
        'وبعدها اشتغلت مع أسماء قوية في المجال، مثل: Eri worre — Damien feier',
        'calvin becerra',
        'وبنيت فريق عالمي فيه أكثر من 10,000 طالب وحققت أكثر من 10,000,000$',
        'مبيعات في التجارة الإلكترونية خلال سنتين، وتعلمت اهم مهارات البزنس، بناء',
        'الأنظمة، المبيعات، التسويق، الإدارة.'
      ],
      image: 'assets/images/anima-home/trust-profit.png',
      imageAlt: 'نتيجة أرباح بقيمة مليون دولار',
      mediaPosition: 'right'
    },
    {
      title: 'التداول كان الحبة السحرية',
      bodyLines: [
        'قررت أبدأ التداول لأنه كان بيعطيني الشي اللي كنت أحلم فيه:',
        'حرية الوقت — حرية المكان — دخل حقيقي',
        'لكن لما دخلت... لقيت عشوائية كبيرة',
        'وهون قررت أغيّر المعادلة وبنيت الـ System اللي كنت محتاجه:',
        'خطوة بخطوة... من الصفر... بدون تخمين'
      ],
      image: 'assets/images/anima-home/trust-studio.png',
      imageAlt: 'مكتب التداول والإضاءة الحمراء',
      mediaPosition: 'left'
    },
    {
      title: 'بنينا حاضنة أحلام وأهداف الشباب Elev8 Club',
      bodyLines: [
        'بدأت الأونلاين بزنس في 2020 بدون خبرة',
        'خلال أول سنة وصلت لأول مليون مبيعات',
        'وبعدها اشتغلت مع أسماء قوية في المجال، مثل: Eri worre — Damien feier',
        'calvin becerra',
        'وبنيت فريق عالمي فيه أكثر من 10,000 طالب وحققت أكثر من 10,000,000$',
        'مبيعات في التجارة الإلكترونية خلال سنتين، وتعلمت اهم مهارات البزنس، بناء',
        'الأنظمة، المبيعات، التسويق، الإدارة.'
      ],
      image: 'assets/images/anima-home/trust-instagram.png',
      imageAlt: 'صفحة Elev8 Club على إنستغرام',
      mediaPosition: 'right',
      mediaKind: 'plain'
    },
    {
      title: 'تحدي elev8 club',
      bodyLines: [
        'قبل عدة أشهر، قدمت النسخة الأولى من التحدي.',
        'والأشخاص اللي طبقوا فعلًا الخطوات اللي شرحتها،',
        'قدروا يحققوا آلاف الدولارات خلال أقل من 30 يوم.',
        'بالبداية فكرنا إنها ممكن تكون مجرد صدفة...',
        'لذلك كررنا التجربة مرة ثانية بالنسخة 2.0.',
        'والنتيجة؟ ناس أكثر بدأت تحقق نتائج حقيقية خلال أسبوع.',
        'وهنا فهمنا إن الموضوع مش حظ، النظام فعلًا يشتغل ويتطور',
        'ويوم 20/5، راح أشرحلك كل شيء خطوة بخطوة',
        'في النسخة الجديدة من هذا التحدي المباشر'
      ],
      image: 'assets/images/anima-home/trust-challenge.png',
      imageAlt: 'تحدي Elev8 Club 0.3',
      mediaPosition: 'left',
      mediaKind: 'plain'
    }
  ];
}
