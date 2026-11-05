import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import * as AOS from 'aos';
import { FirebaseService } from '../../../../../services/firebase.service';
import { GtmService } from '../../../../../services/gtm.service';
import { LandingSettingsService } from '../../../../../services/landing-settings.service';
import { Lead, LeadAnswers, Affiliate } from '../../../../../../core/models';

interface Question {
  id: keyof LeadAnswers;
  number: number;
  text: string;
  hint?: string;
  placeholder?: string;
  type: 'radio' | 'text';
  options?: string[];
  inputMode?: 'numeric' | 'decimal' | 'text';
  validation?: 'age' | 'monthlyIncome';
  validationHint?: string;
}

/** Long enough to see the option fill in, short enough to feel automatic. */
const AUTO_ADVANCE_DELAY_MS = 320;

@Component({
  selector: 'app-question-form-section',
  templateUrl: './question-form-section.component.html',
  styleUrls: ['./question-form-section.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(40px) scale(0.97)' }),
        animate('240ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0, transform: 'translateX(-36px) scale(0.97)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.92)', opacity: 0 }),
        animate('240ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class QuestionFormSectionComponent implements OnInit, OnDestroy {
  questions: Question[] = [
    {
      id: 'challengeIncome',
      number: 1,
      text: 'ما هو وضعك الحالي من ناحية الدخل؟',
      type: 'radio',
      options: ['موظف وراتبي ثابت', 'عندي بزنس خاص', 'فريلانسر', 'حالياً بدون عمل', 'عندي أكثر من مصدر دخل']
    },
    {
      id: 'challengeExperience',
      number: 2,
      text: 'هل لديك خبرة سابقة بالتداول؟',
      type: 'radio',
      options: ['مبتدئ تماماً', 'عندي معرفة بسيطة', 'جربت التداول سابقاً', 'أتداول حالياً']
    },
    {
      id: 'challengeGoal',
      number: 3,
      text: 'ما هو هدفك من المشاركة بالتحدي؟',
      type: 'radio',
      options: ['أتعلم مهارة جديدة', 'أبني مصدر دخل إضافي', 'أستخدم الذكاء الاصطناعي في التداول', 'أطور مستواي بالتداول']
    },
    {
      id: 'challengeCapital',
      number: 4,
      text: 'كم رأس المال المتاح لديك للبدء بالتداول ؟',
      type: 'radio',
      options: ['أقل من 100 دولار', '100–300 دولار', '300–500 دولار', '500–1,000 دولار', 'أكثر من 1,000 دولار']
    },
    {
      id: 'challengeReadiness',
      number: 5,
      text: 'كم أنت جاد في البدء بتطبيق اللي رح تتعلمه؟',
      type: 'radio',
      options: ['جاهز أبدأ مباشرة', 'بدي أفهم النظام أولاً', 'حالياً ببحث عن الخيارات المتاحة']
    },
    {
      id: 'challengeAttendance',
      number: 6,
      // The date is filled in from the dashboard's start date (see ngOnInit); this is what shows until it loads.
      text: 'هل تقدر تحضر التدريب المباشر بتوقيت تركيا ؟',
      type: 'radio',
      options: ['نعم', 'لا']
    }
  ];

  currentQuestion = 0;
  answers: { [key: string]: string } = {};
  showCTA = false;
  isSubmitting = false;
  isSlidingQuestion = false;
  questionSlidePhase: 'idle' | 'leaving' | 'entering' = 'idle';
  touchedAnswers: { [key: string]: boolean } = {};
  readonly successTitleText = 'ممتاز، تسجيلك صار جاهز للخطوة الأخيرة';
  readonly successCopyText = 'اضغط الزر بالأسفل عشان تنتقل للواتساب وتدخل مع الفريق مباشرة.';
  displayedSuccessTitle = '';
  displayedSuccessCopy = '';
  isSuccessTyping = false;
  isSuccessTypingDone = false;
  isOpeningWhatsApp = false;
  hasRequestedWhatsApp = false;
  successTypingTarget: 'title' | 'copy' | 'done' = 'done';

  private leadKey: string | null = null;
  private currentLead: Lead | null = null;
  private affiliateCode: string | null = null;
  private currentAffiliate: Affiliate | null = null;
  private hasTrackedFormStart = false;
  private slideSwapTimer: ReturnType<typeof setTimeout> | null = null;
  private slideDoneTimer: ReturnType<typeof setTimeout> | null = null;
  private successTypeTimer: ReturnType<typeof setTimeout> | null = null;
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute,
    private router: Router,
    private gtm: GtmService,
    private landingSettings: LandingSettingsService
  ) { }

  ngOnInit(): void {
    this.landingSettings.getStartCounterDate().pipe(take(1)).subscribe(startDate => {
      if (!startDate) return;
      const attendance = this.questions.find(item => item.id === 'challengeAttendance');
      if (attendance) attendance.text = `هل تقدر تحضر التدريب المباشر يوم ${this.formatSessionDate(startDate)} بتوقيت تركيا ؟`;
    });

    this.route.queryParams.subscribe(params => {
      this.leadKey = params['lead'] || null;
      this.affiliateCode = params['ref'] || null;

      if (!this.leadKey) {
        alert('الرجاء التسجيل أولاً');
        this.router.navigate(['/home']);
        return;
      }

      this.firebaseService.getLeadByKey(this.leadKey).pipe(take(1)).subscribe(lead => {
        if (!lead) {
          alert('لم يتم العثور على بيانات التسجيل');
          this.router.navigate(['/home']);
          return;
        }

        this.currentLead = lead;

        if (lead.answers) {
          this.answers = Object.entries(lead.answers).reduce((acc, [key, value]) => {
            if (typeof value === 'string') acc[key] = value;
            return acc;
          }, {} as { [key: string]: string });
        }

        if (lead.step === 2) {
          this.openSuccessPanel();
        }

        if (this.affiliateCode && lead.versionKey) {
          this.firebaseService.getAffiliateByCode(this.affiliateCode, lead.versionKey).subscribe(affiliate => {
            this.currentAffiliate = affiliate;
          });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.clearAutoAdvanceTimer();
    this.clearSlideTimers();
    this.clearSuccessTypeTimer();
  }

  get progress(): number {
    return ((this.currentQuestion + 1) / this.questions.length) * 100;
  }

  get currentQ(): Question {
    return this.questions[this.currentQuestion];
  }

  get canProceed(): boolean {
    return this.isAnswerValid(this.currentQ, this.answers[this.currentQ.id]);
  }

  get answeredCount(): number {
    return this.questions.filter(question => this.isAnswerValid(question, this.answers[question.id])).length;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestion === this.questions.length - 1;
  }

  handleAnswer(value: string): void {
    if (this.isSubmitting || this.isSlidingQuestion) return;

    this.answers[this.currentQ.id] = value;
    this.touchedAnswers[this.currentQ.id] = true;
    this.trackQuestionProgress();

    // Move on by itself once the selected state has had a moment to register. Picking another
    // option restarts the timer, so a quick correction still wins; the "next" button remains a
    // full fallback. The last card keeps its explicit submit: choosing an option there must not
    // send the whole questionnaire by accident.
    this.clearAutoAdvanceTimer();
    if (this.isLastQuestion) return;

    this.autoAdvanceTimer = setTimeout(() => {
      this.autoAdvanceTimer = null;
      this.handleNext();
    }, AUTO_ADVANCE_DELAY_MS);
  }

  handleNext(): void {
    this.clearAutoAdvanceTimer();
    this.markQuestionTouched(this.currentQ.id);
    if (!this.canProceed || this.isSubmitting || this.isSlidingQuestion) return;

    if (this.currentQuestion < this.questions.length - 1) {
      this.slideToQuestion(this.currentQuestion + 1);
      return;
    }

    this.submitAnswers();
  }

  /** Back to the previous question; the answers already given stay selected. */
  handlePrevious(): void {
    if (this.currentQuestion === 0 || this.isSubmitting || this.isSlidingQuestion) return;
    this.slideToQuestion(this.currentQuestion - 1);
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    this.markQuestionTouched(this.currentQ.id);
    this.handleNext();
  }

  handleTextInput(): void {
    const answer = this.answers[this.currentQ.id] || '';
    if (answer.trim().length > 0) {
      this.touchedAnswers[this.currentQ.id] = true;
    }
    this.trackQuestionProgress();
  }

  markQuestionTouched(questionId: keyof LeadAnswers): void {
    this.touchedAnswers[questionId] = true;
  }

  shouldShowValidation(): boolean {
    return this.currentQ.type === 'text'
      && !!this.touchedAnswers[this.currentQ.id]
      && !this.isAnswerValid(this.currentQ, this.answers[this.currentQ.id]);
  }

  get validationMessage(): string {
    return this.getValidationMessage(this.currentQ, this.answers[this.currentQ.id]);
  }

  trackQuestionProgress(): void {
    if (!this.leadKey) return;

    if (!this.hasTrackedFormStart) {
      this.gtm.trackQuestionFormStarted(this.leadKey);
      this.hasTrackedFormStart = true;
    }

    this.gtm.trackQuestionFormProgress(this.leadKey, this.answeredCount, this.questions.length);
  }

  private isAnswerValid(question: Question, answer?: string): boolean {
    const value = (answer || '').trim();
    if (!value) return false;

    if (question.type === 'radio') {
      return !!question.options?.includes(value);
    }

    if (question.validation === 'age') {
      const age = this.parsePositiveNumber(value);
      return Number.isInteger(age) && age >= 12 && age <= 75;
    }

    if (question.validation === 'monthlyIncome') {
      const income = this.parsePositiveNumber(value);
      return income >= 0 && income <= 200000;
    }

    return true;
  }

  private getValidationMessage(question: Question, answer?: string): string {
    const value = (answer || '').trim();

    if (!value) {
      return 'هذا السؤال مطلوب عشان نكمل.';
    }

    if (question.validation === 'age') {
      return 'اكتب عمر منطقي بين 12 و 75 سنة.';
    }

    if (question.validation === 'monthlyIncome') {
      return 'اكتب الدخل الشهري كرقم منطقي بالدولار.';
    }

    return 'تأكد من الإجابة قبل المتابعة.';
  }

  private parsePositiveNumber(value: string): number {
    const normalized = this.normalizeArabicDigits(value)
      .replace(/,/g, '')
      .replace(/\$/g, '')
      .trim();

    if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;

    return Number(normalized);
  }

  private normalizeArabicDigits(value: string): string {
    const arabicZero = '٠'.charCodeAt(0);
    const persianZero = '۰'.charCodeAt(0);

    return value.replace(/[٠-٩۰-۹]/g, digit => {
      const code = digit.charCodeAt(0);
      if (code >= arabicZero && code <= arabicZero + 9) {
        return String(code - arabicZero);
      }

      return String(code - persianZero);
    });
  }

  private submitAnswers(): void {
    if (!this.leadKey || this.isSubmitting) return;

    this.isSubmitting = true;

    const answersData: LeadAnswers = {
      challengeIncome: this.answers['challengeIncome'],
      challengeExperience: this.answers['challengeExperience'],
      challengeGoal: this.answers['challengeGoal'],
      challengeCapital: this.answers['challengeCapital'],
      challengeReadiness: this.answers['challengeReadiness'],
      challengeAttendance: this.answers['challengeAttendance']
    };

    this.firebaseService.completeLead(this.leadKey, answersData)
      .then(() => {
        this.currentLead = this.currentLead
          ? { ...this.currentLead, answers: answersData, step: 2, completedAt: new Date().toISOString() }
          : this.currentLead;

        this.gtm.trackCompleteRegistration(this.leadKey!, {
          questions_count: this.questions.length,
          goal: answersData.challengeGoal || '',
          capital: answersData.challengeCapital || '',
          readiness: answersData.challengeReadiness || ''
        });

        this.openSuccessPanel();
        this.isSubmitting = false;
      })
      .catch(error => {
        console.error('Error completing lead:', error);
        alert('حدث خطأ أثناء حفظ الإجابات، الرجاء المحاولة مرة أخرى');
        this.isSubmitting = false;
      });
  }

  /** "15/11 الساعة 9 مساءً", in Istanbul time whatever the visitor's own timezone. */
  private formatSessionDate(timestamp: number): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Istanbul', day: 'numeric', month: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false
    }).formatToParts(new Date(timestamp));
    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    const hours24 = parseInt(get('hour'), 10) % 24;
    const hour12 = hours24 % 12 || 12;
    const minutes = get('minute') === '00' ? '' : `:${get('minute')}`;
    return `${get('day')}/${get('month')} الساعة ${hour12}${minutes} ${hours24 >= 12 ? 'مساءً' : 'صباحاً'}`;
  }

  private slideToQuestion(nextIndex: number): void {
    this.clearSlideTimers();
    this.isSlidingQuestion = true;
    this.questionSlidePhase = 'leaving';

    this.slideSwapTimer = setTimeout(() => {
      this.currentQuestion = nextIndex;
      this.questionSlidePhase = 'entering';
    }, 180);

    this.slideDoneTimer = setTimeout(() => {
      this.isSlidingQuestion = false;
      this.questionSlidePhase = 'idle';
      this.clearSlideTimers();
    }, 540);
  }

  private clearAutoAdvanceTimer(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  private clearSlideTimers(): void {
    if (this.slideSwapTimer) {
      clearTimeout(this.slideSwapTimer);
      this.slideSwapTimer = null;
    }

    if (this.slideDoneTimer) {
      clearTimeout(this.slideDoneTimer);
      this.slideDoneTimer = null;
    }
  }

  private openSuccessPanel(): void {
    const wasAlreadyOpen = this.showCTA;
    this.showCTA = true;
    this.hasRequestedWhatsApp = false;

    if (!wasAlreadyOpen) {
      this.startSuccessTypewriter();
    }

    setTimeout(() => {
      if (typeof AOS.refreshHard === 'function') {
        AOS.refreshHard();
      } else {
        AOS.refresh();
      }
    }, 80);
  }

  private startSuccessTypewriter(): void {
    this.clearSuccessTypeTimer();
    this.displayedSuccessTitle = this.successTitleText;
    this.displayedSuccessCopy = this.successCopyText;
    this.isSuccessTyping = false;
    this.isSuccessTypingDone = true;
    this.successTypingTarget = 'done';
  }

  private typeText(
    text: string,
    update: (value: string) => void,
    done: () => void,
    speed = 30
  ): void {
    const letters = Array.from(text);
    let index = 0;

    const tick = () => {
      index += 1;
      update(letters.slice(0, index).join(''));

      if (index >= letters.length) {
        done();
        return;
      }

      this.successTypeTimer = setTimeout(tick, speed);
    };

    this.successTypeTimer = setTimeout(tick, 120);
  }

  private clearSuccessTypeTimer(): void {
    if (this.successTypeTimer) {
      clearTimeout(this.successTypeTimer);
      this.successTypeTimer = null;
    }
  }

  onSuccessPanelClick(event: MouseEvent): void {
    if (!this.hasRequestedWhatsApp) return;

    const target = event.target as HTMLElement;
    if (target.closest('.whatsapp-button')) return;

    this.showCTA = false;
  }

  async completeRegistration(): Promise<void> {
    if (this.isOpeningWhatsApp) return;

    this.hasRequestedWhatsApp = true;
    this.isOpeningWhatsApp = true;
    const pendingWindow = this.openPendingWhatsAppWindow();

    try {
      const versionKey = this.currentLead?.versionKey;

      if (!versionKey) {
        throw new Error('No lead version found for WhatsApp group assignment');
      }

      const groups = await this.firebaseService.getSalesByVersion(versionKey).pipe(take(1)).toPromise();

      if (!groups || groups.length === 0) {
        throw new Error('No WhatsApp groups found for current version');
      }

      const assignment = await this.reserveNextWhatsAppGroup(groups, 1000);

      if (!assignment) {
        throw new Error('All WhatsApp groups are full or missing links');
      }

      const { group: selectedGroup, groupUrl, groupKey, assignedAt } = assignment;

      this.openWhatsAppGroup(groupUrl, selectedGroup, pendingWindow);
      void this.persistWhatsAppAssignment(selectedGroup, groupUrl, groupKey, assignedAt, versionKey)
        .catch(err => console.warn('Could not persist WhatsApp assignment:', err));
    } catch (err) {
      console.error('Error in completeRegistration:', err);
      this.closePendingWindow(pendingWindow);
      alert('تعذر فتح رابط الواتساب حالياً، حاول مرة أخرى بعد لحظات.');
    } finally {
      this.isOpeningWhatsApp = false;
    }
  }

  private openPendingWhatsAppWindow(): Window | null {
    const pendingWindow = window.open('', '_blank');

    if (pendingWindow) {
      pendingWindow.document.title = 'Opening WhatsApp';
      pendingWindow.document.body.style.cssText = 'margin:0;display:grid;place-items:center;min-height:100vh;background:#05050a;color:#fff;font-family:Arial,sans-serif;text-align:center;';
      pendingWindow.document.body.innerHTML = '<p>Opening WhatsApp...</p>';
    }

    return pendingWindow;
  }

  private closePendingWindow(pendingWindow: Window | null): void {
    if (pendingWindow && !pendingWindow.closed) {
      pendingWindow.close();
    }
  }

  private async persistWhatsAppAssignment(
    selectedGroup: any,
    groupUrl: string,
    groupKey: string,
    assignedAt: number,
    versionKey: string
  ): Promise<void> {
    if (!this.leadKey || !groupKey) return;

    await this.firebaseService.update('leads', this.leadKey, {
      assigned_sales: {
        sales_id: groupKey,
        group_id: groupKey,
        group_name: selectedGroup.group_name || selectedGroup.name || `WhatsApp Group ${selectedGroup.group_order || ''}`.trim(),
        group_link: groupUrl,
        group_order: Number(selectedGroup.group_order) || null,
        whatsapp_number: selectedGroup.whatsapp_number || '',
        assigned_at: assignedAt,
        assigned_via: 'whatsapp_group',
        versionKey
      }
    });

    // The owner is normally set back at registration (register-popup). This is the safety net for
    // a lead whose assignment failed there — it reads first and does nothing if one is already
    // set, so finishing the questions never moves a lead to a second sales member.
    await this.firebaseService.assignSalesMemberIfUnassigned(this.leadKey, versionKey);
  }

  private openWhatsAppGroup(groupUrl: string, group: any, pendingWindow: Window | null = null): void {
    if (this.leadKey) {
      this.gtm.trackWhatsAppContact(this.leadKey, groupUrl, {
        user_name: this.currentLead?.fullName || 'new lead',
        group_id: group.key || 'none',
        group_name: group.group_name || group.name || 'WhatsApp Group',
        group_order: group.group_order || 'none',
        affiliate_code: this.affiliateCode || 'none',
        affiliate_key: this.currentAffiliate?.key || 'none'
      });
    }

    if (pendingWindow && !pendingWindow.closed) {
      pendingWindow.location.href = groupUrl;
      return;
    }

    const newWindow = window.open(groupUrl, '_blank');

    setTimeout(() => {
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = groupUrl;
      }
    }, 100);
  }

  private async reserveNextWhatsAppGroup(
    groups: any[],
    capacity: number
  ): Promise<{ group: any; groupUrl: string; groupKey: string; assignedAt: number } | null> {
    const orderedGroups = groups
      .map((group, index) => ({
        ...group,
        group_order: Number(group.group_order) || index + 1
      }))
      .filter(group => this.getWhatsAppGroupUrl(group))
      .sort((a, b) => a.group_order - b.group_order);

    for (const group of orderedGroups) {
      const groupKey = group.key;
      const currentCount = Number(group.counter) || 0;

      if (!groupKey || currentCount >= capacity) {
        continue;
      }

      const assignedAt = Date.now();

      try {
        await this.firebaseService.incrementSalesCounter(groupKey, assignedAt, capacity);

        return {
          group,
          groupUrl: this.getWhatsAppGroupUrl(group),
          groupKey,
          assignedAt
        };
      } catch {
        continue;
      }
    }

    return null;
  }

  private getWhatsAppGroupUrl(group: any): string {
    const rawLink = (group?.group_link || group?.whatsapp_link || '').trim();

    if (rawLink) {
      if (/^https?:\/\//i.test(rawLink)) return rawLink;
      return `https://${rawLink}`;
    }

    const legacyNumber = (group?.whatsapp_number || '').replace(/[^0-9]/g, '');
    return legacyNumber ? `https://wa.me/${legacyNumber}` : '';
  }

  private openWhatsApp(whatsappNumber: string): void {
    const userName = this.currentLead?.fullName || 'عميل جديد';
    const userEmail = this.currentLead?.email || '';

    const message =
      `مرحباً فريق Elev8 Club،\n\n` +
      `أنا ${userName}، خلصت مشاهدة الفيديو وجاوبت على أسئلة التسجيل.\n\n` +
      `بياناتي المختصرة:\n` +
      `وضعي الحالي: ${this.answers['challengeIncome'] || ''}\n` +
      `خبرتي بالتداول: ${this.answers['challengeExperience'] || ''}\n` +
      `هدفي من التحدي: ${this.answers['challengeGoal'] || ''}\n` +
      `رأس المال المتاح: ${this.answers['challengeCapital'] || ''}\n` +
      `جاهزيتي للتطبيق: ${this.answers['challengeReadiness'] || ''}\n` +
      `حضور التدريب المباشر: ${this.answers['challengeAttendance'] || ''}\n` +
      `الإيميل: ${userEmail}\n\n` +
      `جاهز أعرف الخطوة التالية وأدخل مجموعة الواتساب.`;

    if (this.leadKey) {
      this.gtm.trackWhatsAppContact(this.leadKey, whatsappNumber, {
        user_name: userName,
        affiliate_code: this.affiliateCode || 'none',
        affiliate_key: this.currentAffiliate?.key || 'none'
      });
    }

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(url, '_blank');

    setTimeout(() => {
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = url;
      }
    }, 100);
  }
}
