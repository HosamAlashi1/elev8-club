import { Component } from '@angular/core';

@Component({
  selector: 'app-why-trust-section',
  templateUrl: './why-trust-section.component.html',
  styleUrls: ['./why-trust-section.component.css']
})
export class WhyTrustSectionComponent {
  stories = [
    {
      title: 'القصة بلشت من مكان مغلوب فيه 0-10',
      body: 'غزة. ما في استقرار، ما في رأس مال، ولا أي مقومات واضحة للحياة، بس كان في شي واحد — عناد إني أغيّر واقعي… مهما كان الوضع.',
      image: 'assets/images/canva/khalil-gaza.jpg',
      imageAlt: 'خليل في غزة',
      imageRight: false
    },
    {
      title: 'من الصفر لأول $10,000,000 خلال أول سنتين بزنس',
      body: 'بدأت الأونلاين بزنس في 2020 بدون خبرة. خلال أول سنة → وصلت لأول مليون مبيعات. وبعدها اشتغلت مع أسماء قوية في المجال مثل Eri Worre وDamien Feier وCalvin Becerra. وبنيت فريق عالمي فيه أكثر من 10,000 طالب وحققت أكثر من $10,000,000 مبيعات في التجارة الإلكترونية خلال سنتين.',
      image: 'assets/images/canva/trading-screenshot.png',
      imageAlt: 'نتائج التداول',
      imageRight: true
    },
    {
      title: 'التداول كان الحبة السحرية',
      body: 'قررت أبدأ التداول لأنه كان بيعطيني الشي اللي كنت أحلم فيه: حرية الوقت — حرية المكان — دخل حقيقي. لكن لما دخلت… لقيت عشوائية كبيرة. وهون قررت أغيّر المعادلة وبنيت الـ System اللي كنت محتاجه: خطوة بخطوة… من الصفر… بدون تخمين.',
      image: 'assets/images/canva/khalil-pill.jpg',
      imageAlt: 'خليل — التداول',
      imageRight: false
    },
    {
      title: 'بنينا حاضنة أحلام وأهداف الشباب — Elev8 Club',
      body: 'جمعنا أكثر من 50,000 طالب، وساعدناهم يبدؤوا رحلتهم في التداول والأونلاين بزنس. والآن جاء دورك. مش بدنا نبيع شي — بدنا نثبت إن هذا النظام بينجح معك أنت كمان.',
      image: 'assets/images/canva/elev8-instagram.jpg',
      imageAlt: 'Elev8 Club',
      imageRight: true
    }
  ];
}
