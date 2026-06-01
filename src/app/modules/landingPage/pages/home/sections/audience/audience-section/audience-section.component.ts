import { Component } from '@angular/core';

@Component({
  selector: 'app-audience-section',
  templateUrl: './audience-section.component.html',
  styleUrls: ['./audience-section.component.css'],
})
export class AudienceSectionComponent {
  cards = [
    { icon: 'User',          title: 'العاملين من الـ 5-9',        desc: 'اللي بدهم يبنوا دخل إضافي بدون ما يتركوا شغلهم الحالي.' },
    { icon: 'Home',          title: 'الأمهات وربّات المنزل',      desc: 'اللي بدهم طريقة يعملوا منها دخل من البيت بدون الحاجة لوظيفة تقليدية.' },
    { icon: 'Monitor',       title: 'الـ Freelancers',            desc: 'اللي تعبوا من تبديل الوقت مقابل المال وضغط العملاء المستمر.' },
    { icon: 'GraduationCap', title: 'خريجي الجامعات',             desc: 'اللي بدهم دخل أكبر من الراتب المحدود لأول وظيفة.' },
    { icon: 'Building2',     title: 'موظفي الشركات',              desc: 'اللي بدهم خطة خروج ذكية بدون ما يبدؤوا حياتهم من الصفر.' },
    { icon: 'Smile',         title: 'الأشخاص الانطوائيين',        desc: 'اللي بدهم يربحوا أونلاين بدون ما يطلعوا بوجههم أو يصنعوا محتوى.' },
  ];
}
