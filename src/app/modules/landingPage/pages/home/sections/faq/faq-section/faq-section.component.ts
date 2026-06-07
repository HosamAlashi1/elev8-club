import { Component } from '@angular/core';

interface FAQ {
  question: string;
  answer: string;
  open?: boolean;
}

@Component({
  selector: 'app-faq-section',
  templateUrl: './faq-section.component.html',
  styleUrls: ['./faq-section.component.css']
})
export class FaqSectionComponent {
  faqs: FAQ[] = [
    {
      question: 'كم وقت يحتاج هذا المجال؟',
      answer: 'الجلسة نفسها مدتها حوالي ساعة فقط، وسنشرح كيف يمكن البدء حتى مع وقت محدود.'
    },
    {
      question: 'هل سنطبق التداول بشكل مباشر؟',
      answer: 'راح نوضح الخطوات العملية والمنهجية بشكل مباشر داخل التحدي، بطريقة بسيطة وواضحة.'
    },
    {
      question: 'كم وقت يحتاج هذا المجال؟',
      answer: 'الجلسة نفسها مدتها حوالي ساعة فقط، وسنشرح كيف يمكن البدء حتى مع وقت محدود.',
      open: true
    },
    {
      question: 'هل أحتاج رأس مال كبير حتى أبدأ؟',
      answer: 'لا، الفكرة مبنية على البدء بطريقة بسيطة ومفهومة للمبتدئين بدون تعقيد.'
    },
    {
      question: 'كم وقت يحتاج هذا المجال؟',
      answer: 'الجلسة نفسها مدتها حوالي ساعة فقط، وسنشرح كيف يمكن البدء حتى مع وقت محدود.'
    },
    {
      question: 'هل سنطبق التداول بشكل مباشر؟',
      answer: 'راح نوضح الخطوات العملية والمنهجية بشكل مباشر داخل التحدي، بطريقة بسيطة وواضحة.'
    }
  ];
}
