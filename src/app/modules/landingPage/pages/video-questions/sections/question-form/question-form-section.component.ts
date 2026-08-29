import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import * as AOS from 'aos';
import { FirebaseService } from '../../../../../services/firebase.service';
import { GtmService } from '../../../../../services/gtm.service';
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
      id: 'age',
      number: 1,
      text: 'قديش عمرك؟ دخل عمرك بالسنوات.',
      type: 'text',
      placeholder: 'مثال : 24',
      inputMode: 'numeric',
      validation: 'age',
      validationHint: 'اكتب العمر بالأرقام فقط، بين 12 و 75 سنة.'
    },
    {
      id: 'workStatus',
      number: 2,
      text: 'شو وضعك الحالي شغل؟',
      type: 'radio',
      options: ['عندي شغل براتب ثابت', 'شغلي فريلانس / مستقل', 'عندي مشروع خاص', 'ما عندي دخل حالي']
    },
    {
      id: 'monthlyIncome',
      number: 3,
      text: 'قديش دخلك الشهري بالدولار؟',
      hint: 'معلوماتك سرية وما بنستخدمها إلا عشان نفهم وين ممكن نساعدك.',
      type: 'text',
      placeholder: 'مثال : 800',
      inputMode: 'decimal',
      validation: 'monthlyIncome',
      validationHint: 'اكتب رقم تقريبي بالدولار، بدون رموز أو فواصل.'
    },
    {
      id: 'tradingExperience',
      number: 4,
      text: 'هل جربت التداول قبل؟',
      type: 'radio',
      options: ['لا ما جربت قبل', 'جربت وخسرت', 'جربت بس ما طلعت معي نتيجة', 'عندي شوية خبرة بس بسيطة']
    },
    {
      id: 'financialProblem',
      number: 5,
      text: 'شو أكبر مشكلة مالية عندك حالياً؟',
      type: 'radio',
      options: ['ما عندي مصدر دخل ثاني', 'دخلي قليل وكافي', 'عندي مدخرات بس مش عارف شو أعمل فيها', 'مش عارف وين أبدأ أستثمر']
    },
    {
      id: 'investBudget',
      number: 6,
      text: 'قديش تقدر تخصص من دخلك؟',
      type: 'radio',
      options: ['أقل من $100', '$100 و $500', '$500 و $2,000', 'أكثر من $2000']
    },
    {
      id: 'systemGoal',
      number: 7,
      text: 'شو هدفك الأساسي من دخولك السيستم اليوم؟',
      type: 'radio',
      options: ['أفهم كيف يشتغل التداول', 'أبني دخل إضافي', 'أخرج من الراتب الثابت', 'أبني مشروعي بطريقة صح']
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

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute,
    private router: Router,
    private gtm: GtmService
  ) { }

  ngOnInit(): void {
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
    this.answers[this.currentQ.id] = value;
    this.touchedAnswers[this.currentQ.id] = true;
    this.trackQuestionProgress();
  }

  handleNext(): void {
    this.markQuestionTouched(this.currentQ.id);
    if (!this.canProceed || this.isSubmitting || this.isSlidingQuestion) return;

    if (this.currentQuestion < this.questions.length - 1) {
      this.slideToQuestion(this.currentQuestion + 1);
      return;
    }

    this.submitAnswers();
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
      age: this.answers['age'],
      workStatus: this.answers['workStatus'],
      monthlyIncome: this.answers['monthlyIncome'],
      tradingExperience: this.answers['tradingExperience'],
      financialProblem: this.answers['financialProblem'],
      investBudget: this.answers['investBudget'],
      systemGoal: this.answers['systemGoal']
    };

    this.firebaseService.completeLead(this.leadKey, answersData)
      .then(() => {
        this.currentLead = this.currentLead
          ? { ...this.currentLead, answers: answersData, step: 2, completedAt: new Date().toISOString() }
          : this.currentLead;

        this.gtm.trackCompleteRegistration(this.leadKey!, {
          questions_count: this.questions.length,
          age: answersData.age || '',
          system_goal: answersData.systemGoal || ''
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

    try {
      const salesMemberKey = await this.firebaseService.assignNextSalesMember(versionKey);
      if (salesMemberKey) {
        await this.firebaseService.assignSalesMemberToLead(this.leadKey, salesMemberKey);
      }
    } catch (salesErr) {
      console.warn('Could not assign sales member:', salesErr);
    }
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
      `العمر: ${this.answers['age'] || ''}\n` +
      `وضعي الحالي: ${this.answers['workStatus'] || ''}\n` +
      `الدخل الشهري: ${this.answers['monthlyIncome'] || ''}\n` +
      `تجربتي في التداول: ${this.answers['tradingExperience'] || ''}\n` +
      `أكبر مشكلة مالية عندي: ${this.answers['financialProblem'] || ''}\n` +
      `المبلغ اللي أقدر أخصصه: ${this.answers['investBudget'] || ''}\n` +
      `هدفي من السيستم: ${this.answers['systemGoal'] || ''}\n` +
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
