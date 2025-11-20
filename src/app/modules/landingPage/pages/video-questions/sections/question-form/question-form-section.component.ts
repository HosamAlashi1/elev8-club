import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../../../../services/firebase.service';
import { Lead, LeadAnswers, Affiliate } from '../../../../../../core/models';

interface Question {
  id: string;
  text: string;
  type: 'radio' | 'text';
  options?: string[];
}

@Component({
  selector: 'app-question-form-section',
  templateUrl: './question-form-section.component.html',
  styleUrls: ['./question-form-section.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-50px)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('500ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class QuestionFormSectionComponent implements OnInit {
  questions: Question[] = [
    {
      id: 'experienceLevel',
      text: 'قدّيش خبرتك في التداول؟',
      type: 'radio',
      options: ['مبتدئ', 'متوسط', 'محترف'],
    },
    {
      id: 'readyAmount',
      text: 'كم المبلغ الجاهز تبدأ فيه؟',
      type: 'radio',
      options: ['أقل من $200', '$200 - $1000', 'أكثر من $1000'],
    },
    {
      id: 'readyIn24h',
      text: 'هل جاهز تبدأ خلال 24 ساعة؟',
      type: 'radio',
      options: ['نعم', 'مش متأكد بعد'],
    },
    {
      id: 'location',
      text: 'دولتك و مدينتك؟',
      type: 'text',
    },
    {
      id: 'triedElev8Before',
      text: 'هل جربت خدمات Elev8 Club سابقًا؟',
      type: 'radio',
      options: ['نعم', 'لا'],
    },
    {
      id: 'mainGoal',
      text: 'شو هدفك من التحدي؟',
      type: 'radio',
      options: [
        'أخذ صفقات جاهزة',
        'استخدام روبوت التداول',
        'تعلم التداول',
        'بناء مصدر دخل ثابت',
      ],
    },
  ];

  currentQuestion = 0;
  answers: { [key: string]: string } = {};
  showCTA = false;
  
  private leadKey: string | null = null;
  private currentLead: Lead | null = null;
  private affiliateCode: string | null = null;
  private currentAffiliate: Affiliate | null = null;
  isSubmitting = false;

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // قراءة leadKey و ref من الـ URL
    this.route.queryParams.subscribe(params => {
      this.leadKey = params['lead'] || null;
      this.affiliateCode = params['ref'] || null;

      // إذا لم يكن هناك leadKey، نرجع للصفحة الرئيسية
      if (!this.leadKey) {
        alert('الرجاء التسجيل أولاً');
        this.router.navigate(['/home']);
        return;
      }

      // جلب بيانات الـ Lead
      this.firebaseService.getLeadByKey(this.leadKey).subscribe(lead => {
        if (!lead) {
          alert('لم يتم العثور على بيانات التسجيل');
          this.router.navigate(['/home']);
          return;
        }
        this.currentLead = lead;
      });

      // جلب بيانات الأفلييت إذا كان موجود
      if (this.affiliateCode) {
        this.firebaseService.getAffiliateByCode(this.affiliateCode).subscribe(affiliate => {
          this.currentAffiliate = affiliate;
        });
      }
    });
  }

  get progress(): number {
    return ((this.currentQuestion + 1) / this.questions.length) * 100;
  }

  get currentQ(): Question {
    return this.questions[this.currentQuestion];
  }

  get canProceed(): boolean {
    return this.answers[this.currentQ.id] !== undefined && this.answers[this.currentQ.id] !== '';
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  handleAnswer(value: string): void {
    this.answers[this.currentQ.id] = value;

    // Auto-advance for radio questions
    if (this.currentQ.type === 'radio') {
      setTimeout(() => {
        if (this.currentQuestion < this.questions.length - 1) {
          this.currentQuestion++;
        } else {
          this.submitAnswers();
        }
      }, 300);
    }
  }

  handleNext(): void {
    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
    } else {
      this.submitAnswers();
    }
  }

  private submitAnswers(): void {
    if (!this.leadKey || this.isSubmitting) return;

    this.isSubmitting = true;

    // استخراج الدولة والمدينة من إجابة السؤال location
    const location = this.answers['location'] || '';
    const locationParts = location.split(',').map(p => p.trim());
    const country = locationParts[0] || '';
    const city = locationParts[1] || locationParts[0] || '';

    // تحويل الإجابات للصيغة المطلوبة
    const answersData: LeadAnswers = {
      experienceLevel: this.mapExperienceLevel(this.answers['experienceLevel']),
      readyAmount: this.mapReadyAmount(this.answers['readyAmount']),
      readyIn24h: this.mapYesNo(this.answers['readyIn24h']),
      location: this.answers['location'],
      triedElev8Before: this.mapYesNo(this.answers['triedElev8Before']),
      mainGoal: this.mapMainGoal(this.answers['mainGoal'])
    };

    // تحديث الـ Lead في Firebase
    this.firebaseService.completeLead(this.leadKey, answersData, country, city)
      .then(() => {
        console.log('Lead completed successfully');
        this.showCTA = true;
        this.isSubmitting = false;
      })
      .catch(error => {
        console.error('Error completing lead:', error);
        alert('حدث خطأ أثناء حفظ الإجابات، الرجاء المحاولة مرة أخرى');
        this.isSubmitting = false;
      });
  }

  completeRegistration(): void {
    // التوجيه لواتساب الأفلييت أو واتساب عام
    const whatsappNumber = this.currentAffiliate?.whatsappNumber?.replace(/[^0-9]/g, '') || '972598046069';
    const userName = this.currentLead?.fullName || 'عميل جديد';
    const message = `مرحباً، أنا ${userName}. لقد أكملت التسجيل والأسئلة في تحدي Elev8 Club وأرغب بالانضمام للمجموعة.`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // دوال مساعدة لتحويل الإجابات
  private mapExperienceLevel(answer: string): 'beginner' | 'intermediate' | 'advanced' | undefined {
    if (answer === 'مبتدئ') return 'beginner';
    if (answer === 'متوسط') return 'intermediate';
    if (answer === 'محترف') return 'advanced';
    return undefined;
  }

  private mapReadyAmount(answer: string): '<200' | '200-1000' | '>1000' | undefined {
    if (answer === 'أقل من $200') return '<200';
    if (answer === '$200 - $1000') return '200-1000';
    if (answer === 'أكثر من $1000') return '>1000';
    return undefined;
  }

  private mapYesNo(answer: string): 'yes' | 'no' | undefined {
    if (answer === 'نعم') return 'yes';
    if (answer === 'لا' || answer === 'مش متأكد بعد') return 'no';
    return undefined;
  }

  private mapMainGoal(answer: string): 'ready_trades' | 'trading_bot' | 'learn_trading' | 'steady_income' | undefined {
    if (answer === 'أخذ صفقات جاهزة') return 'ready_trades';
    if (answer === 'استخدام روبوت التداول') return 'trading_bot';
    if (answer === 'تعلم التداول') return 'learn_trading';
    if (answer === 'بناء مصدر دخل ثابت') return 'steady_income';
    return undefined;
  }

}
