import { Component } from '@angular/core';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq-section',
  templateUrl: './faq-section.component.html',
  styleUrls: ['./faq-section.component.css']
})
export class FaqSectionComponent {
  faqs: FAQ[] = [
    {
      question: "ليش التحدي مجاني؟",
      answer: "لأنه أول وآخر مرة بنقدمه مجاناً. نؤمن بأن كل شخص يستحق فرصة تعلم مهارة التداول، ونريد بناء مجتمع قوي من المتداولين الناجحين.",
      isOpen: false
    },
    {
      question: "هل في مخاطر؟",
      answer: "أكيد، التداول يحتوي على مخاطر كأي استثمار. لكن بنعلّمك كيف تديرها وتقلل منها من خلال استراتيجيات مدروسة وإدارة رأس المال الصحيحة.",
      isOpen: false
    },
    {
      question: "هل لازم أودع فلوس؟",
      answer: "الشرط الوحيد فتح حساب جديد من خلالنا وإيداع. هذا يساعدنا على تقديم المحتوى المجاني، وأنت تحصل على تدريب عملي على منصة احترافية.",
      isOpen: false
    },
    {
      question: "كم الوقت المطلوب يومياً؟",
      answer: "حوالي 60 دقيقة فقط. التحدي مصمم للأشخاص المشغولين، بحيث يمكنك التعلم والتطبيق في ساعة واحدة يومياً.",
      isOpen: false
    },
    {
      question: "هل التحدي مناسب للمبتدئين؟",
      answer: "نعم 100%! التحدي مصمم خصيصاً للمبتدئين الذين ليس لديهم أي خبرة سابقة في التداول. نبدأ معك من الصفر.",
      isOpen: false
    },
    {
      question: "ماذا أحتاج للبدء؟",
      answer: "فقط جهاز (موبايل أو كمبيوتر) واتصال بالإنترنت والتزام 7 أيام. كل الأدوات والموارد التعليمية نوفرها لك.",
      isOpen: false
    }
  ];

  toggleFAQ(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
}
