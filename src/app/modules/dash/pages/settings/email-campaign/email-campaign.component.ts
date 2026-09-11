import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiAdminService } from 'src/app/modules/services/api.admin.service';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { ToastrsService } from 'src/app/modules/services/toater.service';
import { SalesMember } from 'src/app/core/models';
import { PLACEHOLDER_HINTS, renderPreview } from './email-shell';

/** One selectable chip in a filter group. */
interface Choice {
  value: string | number;
  label: string;
}

/**
 * A collapsible block of chips.
 *
 * The filters are data-driven rather than nine near-identical blocks of markup: the panel is
 * long enough already, and every group that gets its own hand-written copy is a group whose
 * behaviour drifts from the others.
 */
interface FilterGroup {
  /** Matches a key in `selected`. */
  key: string;
  title: string;
  choices: Choice[];
  /** Hidden entirely when the audience cannot contain a v2 lead. */
  v2Only?: boolean;
}

const DEFAULT_SUBJECT = 'رسالة من Elev8 Club';

const DEFAULT_BODY = `<p>مرحباً {{name}} 👋</p>
<p>اكتب رسالتك هنا.</p>
<p>فريق Elev8</p>`;

/**
 * Bulk email to leads.
 *
 * The audience is described here as *filters* and resolved on the server — the browser never
 * sends a list of addresses. That is what keeps the count shown next to the Send button honest:
 * it comes from the same function, in dry-run mode, that will do the sending.
 *
 * The email itself is only the body. The branded shell (green header, gold wordmark, footer,
 * unsubscribe link) is added by the function so every campaign matches the welcome email;
 * `email-shell.ts` mirrors it for the preview.
 */
@Component({
  selector: 'app-email-campaign',
  templateUrl: './email-campaign.component.html',
  styleUrls: ['./email-campaign.component.css']
})
export class EmailCampaignComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── The email ────────────────────────────────────────────────────────────
  emailSubject = DEFAULT_SUBJECT;
  emailContent = DEFAULT_BODY;
  preheader = '';

  readonly placeholders = PLACEHOLDER_HINTS;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  };

  // ── The audience ─────────────────────────────────────────────────────────
  // Every group is "tick none = don't care". Nothing ticked anywhere means everyone, which is
  // why the resolved count is always shown before the Send button will do anything.

  readonly groups: FilterGroup[] = [
    {
      key: 'sources',
      title: 'النسخة',
      choices: [
        { value: 'v1', label: 'الأولى — Webinar' },
        { value: 'v2', label: 'الثانية — Free community' },
      ],
    },
    {
      key: 'steps',
      title: 'مرحلة التسجيل',
      choices: [
        { value: 1, label: 'ما كمّل الأسئلة' },
        { value: 2, label: 'كمّل الأسئلة' },
      ],
    },
    {
      key: 'salesStatuses',
      title: 'حالة المبيعات',
      choices: [
        { value: 'bot_followup', label: 'متابعة البوت' },
        { value: 'new', label: 'جديد' },
        { value: 'pre_meeting', label: 'قبل الاجتماع' },
        { value: 'post_meeting', label: 'بعد الاجتماع' },
        { value: 'follow_up', label: 'متابعة' },
        { value: 'closed', label: 'مغلق' },
        { value: 'not_interested', label: 'غير مهتم' },
      ],
    },
    {
      key: 'qualifications',
      title: 'نتيجة التأهيل',
      v2Only: true,
      choices: [
        { value: 'qualified', label: 'مؤهل' },
        { value: 'qualified_prep', label: 'يحتاج تجهيز' },
        { value: 'not_qualified', label: 'غير مؤهل' },
      ],
    },
    {
      key: 'accountVerification',
      title: 'توثيق الحساب',
      v2Only: true,
      choices: [
        { value: 'not_submitted', label: 'ما أرسل' },
        { value: 'pending', label: 'بانتظار المراجعة' },
        { value: 'verified', label: 'موثّق' },
        { value: 'rejected', label: 'مرفوض' },
      ],
    },
    {
      // The bot's seven onboarding steps (TMS_Backend FreeBotSteps). Numbers only as the chip
      // label, with the full name on hover — seven wrapped sentences is what made this panel
      // unreadable in the first place.
      key: 'botSteps',
      title: 'خطوة البوت',
      v2Only: true,
      choices: [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' },
        { value: 6, label: '6' },
        { value: 7, label: '7' },
      ],
    },
  ];

  /** Full names for the bot-step chips, shown as tooltips. */
  readonly botStepNames: Record<number, string> = {
    1: 'مقدمة التداول',
    2: 'فتح الحساب',
    3: 'توثيق الحساب',
    4: 'الإيداع',
    5: 'إرسال رقم الحساب',
    6: 'قيد المراجعة',
    7: 'الدخول للمجتمع',
  };

  /** Which accordion sections are expanded. Only the first is open on arrival. */
  openGroups = new Set<string>(['sources']);
  showAdvanced = false;

  selected: Record<string, Array<string | number>> = {
    sources: [],
    steps: [],
    salesStatuses: [],
    qualifications: [],
    accountVerification: [],
    botSteps: [],
  };

  botStarted: '' | 'yes' | 'no' = '';
  alreadyEmailed: '' | 'yes' | 'no' = '';
  createdFrom = '';
  createdTo = '';
  salesMemberKey = '';
  salesMembers: SalesMember[] = [];

  // ── State ────────────────────────────────────────────────────────────────
  matchedCount: number | null = null;
  isCounting = false;
  countError = '';

  isSending = false;
  isTesting = false;
  testEmail = '';

  showPreview = false;
  /**
   * The preview document for the iframe's `srcdoc`. Marked trusted because we build it here
   * from our own template — the only outside input is the admin's own editor content, which is
   * already trusted HTML that will be sent verbatim to customers.
   */
  previewDoc: SafeHtml | null = null;

  lastResult: { sent: number; failed: number; campaignId: string } | null = null;

  private countTimer: ReturnType<typeof setTimeout> | null = null;
  /** The Quill instance, handed over by (onEditorCreated). */
  private quill: any = null;

  constructor(
    private apiAdminService: ApiAdminService,
    private firebaseService: FirebaseService,
    private toastr: ToastrsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.firebaseService.getCurrentVersion()
      .pipe(takeUntil(this.destroy$))
      .subscribe(version => {
        if (!version) return;
        this.firebaseService.getSalesMembersByVersion(version.key)
          .pipe(takeUntil(this.destroy$))
          .subscribe(members => this.salesMembers = members);
      });

    this.refreshCount();
  }

  ngOnDestroy(): void {
    if (this.countTimer) clearTimeout(this.countTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  /** True when v2 is selected, or when no source is selected (so v2 is included). */
  get v2InPlay(): boolean {
    return this.selected['sources'].length === 0 || this.selected['sources'].includes('v2');
  }

  /** v2-only groups vanish when the audience cannot contain a v2 lead. */
  get visibleGroups(): FilterGroup[] {
    return this.groups.filter(g => !g.v2Only || this.v2InPlay);
  }

  isTicked(group: string, value: string | number): boolean {
    return this.selected[group].includes(value);
  }

  /** Shown on the collapsed header so the section reads without expanding it. */
  countIn(group: string): number {
    return this.selected[group]?.length || 0;
  }

  /** Everything currently narrowing the audience, for the "filters on" badge. */
  get activeFilterCount(): number {
    const chips = Object.values(this.selected)
      .reduce((sum, list) => sum + list.length, 0);
    const extras = [
      this.botStarted, this.alreadyEmailed,
      this.createdFrom, this.createdTo, this.salesMemberKey,
    ].filter(Boolean).length;
    return chips + extras;
  }

  isOpen(group: string): boolean {
    return this.openGroups.has(group);
  }

  toggleGroup(group: string): void {
    if (this.openGroups.has(group)) this.openGroups.delete(group);
    else this.openGroups.add(group);
  }

  toggle(group: string, value: string | number): void {
    const list = this.selected[group];
    const at = list.indexOf(value);
    if (at >= 0) list.splice(at, 1);
    else list.push(value);
    this.onFiltersChanged();
  }

  clearFilters(): void {
    Object.keys(this.selected).forEach(k => this.selected[k] = []);
    this.botStarted = '';
    this.alreadyEmailed = '';
    this.createdFrom = '';
    this.createdTo = '';
    this.salesMemberKey = '';
    this.onFiltersChanged();
  }

  /**
   * Debounced: every tick would otherwise fire its own round trip, and someone building a
   * multi-part filter ticks five boxes in two seconds.
   */
  onFiltersChanged(): void {
    if (this.countTimer) clearTimeout(this.countTimer);
    this.countTimer = setTimeout(() => this.refreshCount(), 350);
  }

  private buildFilters(): Record<string, unknown> {
    const f: Record<string, unknown> = {};
    Object.entries(this.selected).forEach(([key, list]) => {
      if (list.length) f[key] = list;
    });
    if (this.botStarted) f['botStarted'] = this.botStarted;
    if (this.alreadyEmailed) f['alreadyEmailed'] = this.alreadyEmailed;
    if (this.createdFrom) f['createdFrom'] = this.createdFrom;
    if (this.createdTo) f['createdTo'] = this.createdTo;
    if (this.salesMemberKey) f['salesMemberKey'] = this.salesMemberKey;
    return f;
  }

  /** Asks the sending function itself how many match, so the two can never disagree. */
  refreshCount(): void {
    this.isCounting = true;
    this.countError = '';
    this.apiAdminService.sendCampaignEmail({
      subject: this.emailSubject,
      bodyHtml: this.emailContent,
      filters: this.buildFilters(),
      dryRun: true,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.matchedCount = res?.matched ?? 0;
        this.isCounting = false;
      },
      error: err => {
        this.matchedCount = null;
        this.countError = err?.message || 'تعذّر حساب عدد المستلمين';
        this.isCounting = false;
      }
    });
  }

  // ── Preview ──────────────────────────────────────────────────────────────
  togglePreview(): void {
    this.showPreview = !this.showPreview;
    if (this.showPreview) {
      this.previewDoc = this.sanitizer.bypassSecurityTrustHtml(
        renderPreview(this.emailContent, this.preheader)
      );
    }
  }

  /**
   * Quill owns the editor's DOM, so the model is not the place to write into it.
   *
   * The first attempt appended the token to `emailContent` and relied on the ngModel binding to
   * push it back in. It did nothing useful: Quill re-normalizes whatever it is handed, and a
   * token glued onto the end of the HTML is the wrong place anyway — it belongs where the
   * cursor is, mid-sentence, which is the only reason you reach for it.
   */
  onEditorCreated(quill: any): void {
    this.quill = quill;

    // ngx-quill does not reliably push the initial ngModel value into a freshly created
    // editor, which is why the starter text never appeared — the page shipped behind a
    // commented-out tab, so nobody had ever seen it fail. An empty Quill document has
    // length 1 (the trailing newline), so that is the test for "the editor is blank".
    if (this.emailContent && quill.getLength() <= 1) {
      quill.clipboard.dangerouslyPasteHTML(this.emailContent);
    }
  }

  insertPlaceholder(token: string): void {
    if (!this.quill) {
      // Editor not ready yet — appending is still better than losing the click.
      this.emailContent = (this.emailContent || '') + ` ${token}`;
      return;
    }

    // Where the cursor was before the button stole focus; end of document if never placed.
    const range = this.quill.getSelection(true);
    const at = range ? range.index : this.quill.getLength();

    this.quill.insertText(at, token, 'user');
    this.quill.setSelection(at + token.length, 0, 'user');
    this.quill.focus();
  }

  // ── Sending ──────────────────────────────────────────────────────────────
  /**
   * One copy to one address. Worth doing every time: a preview pane renders in Chrome, and
   * Gmail's renderer is not Chrome's.
   */
  sendTest(): void {
    const to = this.testEmail.trim();
    if (!to) {
      this.toastr.showWarning('اكتب إيميل للتجربة أولاً');
      return;
    }
    this.isTesting = true;
    this.apiAdminService.sendCampaignEmail({
      subject: this.emailSubject,
      bodyHtml: this.emailContent,
      preheader: this.preheader,
      filters: {},
      testEmail: to,
    }).subscribe({
      next: () => {
        this.isTesting = false;
        this.toastr.showSuccess(`تم إرسال نسخة تجريبية إلى ${to}`);
      },
      error: err => {
        this.isTesting = false;
        this.toastr.showError(err?.message || 'فشل إرسال التجربة');
      }
    });
  }

  send(): void {
    if (!this.emailSubject.trim()) {
      this.toastr.showWarning('اكتب موضوع الرسالة');
      return;
    }
    if (!this.matchedCount) {
      this.toastr.showWarning('لا يوجد أي ليد مطابق للفلاتر');
      return;
    }

    const ok = confirm(
      `سيتم إرسال الرسالة إلى ${this.matchedCount} ليد. هل أنت متأكد؟`
    );
    if (!ok) return;

    this.isSending = true;
    this.lastResult = null;

    this.apiAdminService.sendCampaignEmail({
      subject: this.emailSubject,
      bodyHtml: this.emailContent,
      preheader: this.preheader,
      filters: this.buildFilters(),
    }).subscribe({
      next: res => {
        this.isSending = false;
        this.lastResult = {
          sent: res?.sent ?? 0,
          failed: res?.failed ?? 0,
          campaignId: res?.campaignId ?? '',
        };
        if (this.lastResult.failed > 0) {
          this.toastr.showWarning(
            `تم إرسال ${this.lastResult.sent}، وفشل ${this.lastResult.failed}`
          );
        } else {
          this.toastr.showSuccess(`تم الإرسال إلى ${this.lastResult.sent} ليد`);
        }
      },
      error: err => {
        this.isSending = false;
        this.toastr.showError(err?.message || 'فشل الإرسال');
      }
    });
  }
}
