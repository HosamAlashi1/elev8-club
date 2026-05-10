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
      question: 'هل التحدي مجاناً؟',
      answer: 'نعم، التحدي مجاني بالكامل للحضور.',
      isOpen: false
    },
    {
      question: 'هل أحتاج أي خبرة سابقة؟',
      answer: 'لا. هذا التحدي مصمم للمبتدئين بالكامل، وسنشرح كل شيء خطوة بخطوة.',
      isOpen: false
    },
    {
      question: 'ماذا لو كنت لا أعرف أي شيء عن التداول؟',
      answer: 'هذا طبيعي جداً. أغلب الأشخاص الذين يبدأون معنا لا يملكون أي خبرة مسبقة.',
      isOpen: false
    },
    {
      question: 'هل التداول حرام؟',
      answer: 'نحن نستخدم حسابات إسلامية خالية من الفوائد الربوية (Swap-Free)، ولا يوجد عليها أي فوائد تثبيت أو معاملات ربوية.',
      isOpen: false
    },
    {
      question: 'هل أحتاج رأس مال كبير حتى أبدأ؟',
      answer: 'لا. يمكنك البدء بمبلغ بسيط والتطور خطوة بخطوة.',
      isOpen: false
    },
    {
      question: 'هل أستطيع البدء بجانب الوظيفة أو الدراسة؟',
      answer: 'نعم. أغلب الأشخاص الذين يحضرون التحدي هم طلاب أو موظفون.',
      isOpen: false
    },
    {
      question: 'كم وقت يحتاج هذا المجال؟',
      answer: 'الجلسة نفسها مدتها حوالي ساعة فقط، وسنشرح كيف يمكن البدء حتى مع وقت محدود.',
      isOpen: false
    },
    {
      question: 'هل سنطبق التداول بشكل مباشر؟',
      answer: 'نعم. في آخر جزء من الجلسة سنطبق التداول live خطوة بخطوة.',
      isOpen: false
    },
    {
      question: 'ماذا لو جرّبت الأونلاين بزنس من قبل ولم تنجح؟',
      answer: 'أغلب الناس يبدأوا لحالهم بدون نظام واضح، ويبدأوا بدون شخص يوجههم. فيتشتتوا بين الفيديوهات والمعلومات المتناقضة وفي النهاية يتوقفوا بدون نتيجة. ولهذا صمّمنا هذا التحدي — حتى نختصر عليك الطريق ونبسط البداية قدر الإمكان.',
      isOpen: false
    },
    {
      question: 'ماذا لو لم أستطع حضور البث المباشر؟',
      answer: 'حاول أن تحضر بشكل مباشر، لأن التطبيق العملي سيكون أثناء الجلسة نفسها.',
      isOpen: false
    },
    {
      question: 'متى يبدأ التحدي؟',
      answer: 'يبدأ التحدي الساعة 9 مساءً بتوقيت مصر.',
      isOpen: false
    }
  ];

  toggleFAQ(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
}
