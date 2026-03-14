import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { FirebaseService } from '../../../../../services/firebase.service';
import { GtmService } from '../../../../../services/gtm.service';
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
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(60px) scale(0.95)' }),
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({ opacity: 1, transform: 'translateX(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.55, 0, 0.55, 0.2)',
          style({ opacity: 0, transform: 'translateX(-60px) scale(0.95)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('200ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
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
  private hasTrackedFormStart = false;

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute,
    private router: Router,
    private gtm: GtmService
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

        // إذا كان Lead خلص الخطوة الثانية (أجاب على الأسئلة)، نعرض CTA مباشرة
        if (lead.step === 2) {
          this.showCTA = true;
        }
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
    const answer = this.answers[this.currentQ.id];
    if (!answer || answer.trim() === '') {
      return false;
    }
    return true;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  handleAnswer(value: string): void {
    this.answers[this.currentQ.id] = value;

    // Stage 5: Track Question Form Start (first interaction)
    if (!this.hasTrackedFormStart && this.leadKey) {
      this.gtm.trackQuestionFormStarted(this.leadKey);
      this.hasTrackedFormStart = true;
    }

    // Stage 5: Track Question Form Progress
    if (this.leadKey) {
      const answeredCount = Object.keys(this.answers).length;
      this.gtm.trackQuestionFormProgress(
        this.leadKey,
        answeredCount,
        this.questions.length
      );
    }

    // Auto-advance for radio questions - فوري تقريباً
    if (this.currentQ.type === 'radio') {
      setTimeout(() => {
        if (this.currentQuestion < this.questions.length - 1) {
          this.currentQuestion++;
        } else {
          this.submitAnswers();
        }
      }, 150);
    }
  }

  handleNext(): void {
    if (!this.canProceed) return;

    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
    } else {
      this.submitAnswers();
    }
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    this.handleNext();
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

        // Stage 6: Track Complete Registration
        if (this.leadKey) {
          this.gtm.trackCompleteRegistration(this.leadKey, {
            questions_count: this.questions.length,
            country: country,
            city: city
          });
        }

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
    // جلب أرقام المبيعات من Firebase
    this.firebaseService.list('sales').pipe(take(1)).subscribe({
      next: (salesItems: any[]) => {
        if (!salesItems || salesItems.length === 0) {
          console.error('No sales items found');
          return;
        }

        // إيجاد الـ sales item اللي ما تم assign له من أطول فترة (Round Robin)
        const sortedSales = salesItems.sort((a, b) => {
          const lastAssignedA = a.last_assigned_at || 0;
          const lastAssignedB = b.last_assigned_at || 0;

          // الأقدم أولاً (اللي ما تم assign له من أطول فترة)
          return lastAssignedA - lastAssignedB;
        });

        const selectedSales = sortedSales[0];
        const whatsappNumber = (selectedSales.whatsapp_number).replace(/[^0-9]/g, '');
        const salesKey = selectedSales.key;
        const assignedAt = Date.now();

        // تحديث الـ Lead بإضافة معلومات الـ Sales المُخصّص
        if (this.leadKey && salesKey) {
          const assignedSalesData = {
            assigned_sales: {
              sales_id: salesKey,
              whatsapp_number: whatsappNumber,
              assigned_at: assignedAt,
              assigned_via: 'whatsapp'
            }
          };

          this.firebaseService.update('leads', this.leadKey, assignedSalesData)
            .then(() => {
              console.log(`Lead ${this.leadKey} assigned to sales ${salesKey}`);
            })
            .catch(err => {
              console.error('Error assigning sales to lead:', err);
              // لا نوقف التنفيذ - نكمل فتح واتساب
            });
        }

        // تحديث الـ counter والـ last_assigned_at للـ sales المختار
        if (salesKey) {
          const newCounter = (selectedSales.counter || 0) + 1;
          this.firebaseService.update('sales', salesKey, {
            counter: newCounter,
            last_assigned_at: assignedAt
          })
            .then(() => {
              console.log(`Updated sales ${salesKey}: counter=${newCounter}, assigned_at=${assignedAt}`);
            })
            .catch(err => {
              console.error('Error updating sales counter:', err);
            });
        }

        // فتح واتساب
        this.openWhatsApp(whatsappNumber);
      },
      error: (err) => {
        console.error('Error loading sales items:', err);
      }
    });
  }

  private openWhatsApp(whatsappNumber: string): void {
    const userName = this.currentLead?.fullName || 'عميل جديد';
    const userEmail = this.currentLead?.email || '';
    const country = this.currentLead?.country || '';
    const city = this.currentLead?.city || '';

    // Extract answers (use empty strings as fallback)
    const experience = this.answers['experienceLevel'] || '';
    const readyAmount = this.answers['readyAmount'] || '';
    const readyIn24h = this.answers['readyIn24h'] || '';
    const triedBefore = this.answers['triedElev8Before'] || '';
    const mainGoal = this.answers['mainGoal'] || '';
    const location = this.answers['location'] || '';

    // Build the message exactly as requested
    const message = `مرحباً فريق Elev8 Club،\n\n` +
      `أنا ${userName} — متحمّس جداً أبدأ معكم وبشكركم على الوقت والجهد الكبير اللي بتبذلوه يومياً لخدمة الناس.\n\n` +
      `هذه نبذة بسيطة عن وضعي عشان تقدروا تساعدوني أبدأ بالطريقة الصحيحة:\n\n` +
      `أنا خبرتي في التداول: ${experience}\n` +
      `وحالياً متواجد في: ${location}\n` +
      `وإيميلي: ${userEmail}\n` +
      `وعندي مبلغ جاهز للبدء حوالي: ${readyAmount}\n` +
      `وأنا جاهز أبدأ خلال 24 ساعة: ${readyIn24h}\n` +
      `بالنسبة لخدمات Elev8 Club: ${triedBefore}\n` +
      `ودخولي التحدي بالنسبة إلي هدفه الأساسي هو: ${mainGoal}\n\n` +
      `بعرف إنه عندكم ضغط رسائل كبير وبقدّر وقتكم جداً،\n` +
      `بس كل اللي بحتاجه الآن — إيش الخطوة الجاية مباشرة عشان أبدأ؟\n` +
      `جاهز أمشي معكم خطوة بخطوة وأطبق كل التعليمات بإذن الله.\n\n` +
      `بانتظار توجيهكم 🙏🔥`;

    // Debug log the message
    console.log('WhatsApp message to send:', message);

    // Stage 7: Track WhatsApp Contact
    if (this.leadKey) {
      this.gtm.trackWhatsAppContact(this.leadKey, whatsappNumber, {
        user_name: userName,
        location: location,
        affiliate_code: this.affiliateCode || 'none'
      });
    }

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // حاول الفتح مباشرةً
    const newWindow = window.open(url, '_blank');

    // إذا فشلت، جرّب حل بديل
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // ممكن تعرض لهم رسالة أو تحاول بطريقة أخرى
      alert('يبدو أن المتصفح منع فتح واتساب مباشرةً. الرجاء فتح الرابط يدوياً: ' + url);
    }
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
