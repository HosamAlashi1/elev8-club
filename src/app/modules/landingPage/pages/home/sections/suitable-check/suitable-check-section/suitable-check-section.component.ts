import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-suitable-check-section',
  templateUrl: './suitable-check-section.component.html',
  styleUrls: ['./suitable-check-section.component.css']
})
export class SuitableCheckSectionComponent {
  @Input() onOpenRegistration!: () => void;

  personas = [
    { icon: 'User', title: 'العاملين من الـ 5-9', desc: 'اللي بدهم يبنوا دخل إضافي بدون ما يتركوا شغلهم الحالي.' },
    { icon: 'Home', title: 'الأمهات وربّات المنزل', desc: 'اللي بدهم طريقة يعملوا منها دخل من البيت بدون الحاجة لوظيفة تقليدية.' },
    { icon: 'Monitor', title: 'الـ Freelancers', desc: 'اللي تعبوا من تبديل الوقت مقابل المال وضغط العملاء المستمر.' },
    { icon: 'Smile', title: 'الأشخاص الانطوائيين', desc: 'اللي بدهم يربحوا أونلاين بدون ما يطلعوا بوجههم أو يصنعوا محتوى.' },
    { icon: 'Building2', title: 'موظفي الشركات', desc: 'اللي بدهم خطة خروج ذكية بدون ما يبدؤوا حياتهم من الصفر.' },
    { icon: 'GraduationCap', title: 'خريجي الجامعات', desc: 'اللي بدهم دخل أكبر من الراتب المحدود لأول وظيفة.' }
  ];

  notSuitable = [
    'من يبحث عن ثروة لحظية بدون أي جهد أو تعلم',
    'من يريد نتائج مضمونة 100% بدون أي خطوة عملية',
    'من ليس مستعداً يستثمر ساعة واحدة في تعلّم شيء يغيّر حياته'
  ];
}
