import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-suitable-check-section',
  templateUrl: './suitable-check-section.component.html',
  styleUrls: ['./suitable-check-section.component.css']
})
export class SuitableCheckSectionComponent {
  @Input() onOpenRegistration!: () => void;

  personas = [
    { icon: 'BriefcaseBusiness', title: 'العاملين من الـ 9–5', desc: 'اللي بدهم يبنوا دخل إضافي بدون ما يتركوا شغلهم الحالي.' },
    { icon: 'House', title: 'الأمهات وربّات المنزل', desc: 'اللي بدهم طريقة يعملوا منها دخل من البيت بدون الحاجة لوظيفة تقليدية.' },
    { icon: 'Laptop', title: 'الـ Freelancers', desc: 'اللي تعبوا من تبديل الوقت مقابل المال وضغط العملاء المستمر.' },
    { icon: 'GraduationCap', title: 'خريجو الجامعات', desc: 'اللي بدهم دخل أكبر من الراتب المحدود لأول وظيفة.' },
    { icon: 'Building2', title: 'موظفو الشركات', desc: 'اللي بدهم خطة خروج ذكية بدون ما يبدؤوا حياتهم من الصفر.' },
    { icon: 'Theater', title: 'الأشخاص الانطوائيون', desc: 'اللي بدهم يربحوا أونلاين بدون ما يطلعوا بوجههم أو يصنعوا محتوى.' }
  ];

  notSuitable = [
    'من يبحث عن ثروة لحظية بدون أي جهد أو تعلم',
    'من يريد نتائج مضمونة 100% بدون أي خطوة عملية',
    'من ليس مستعداً يستثمر ساعة واحدة في تعلّم شيء يغيّر حياته'
  ];
}
