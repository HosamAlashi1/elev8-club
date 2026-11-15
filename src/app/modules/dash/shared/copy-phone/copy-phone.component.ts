import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';

/**
 * A phone number followed by a small copy button. The button morphs into a green check for a
 * moment after copying. Used everywhere a lead's phone is shown in the dashboard.
 */
@Component({
  selector: 'app-copy-phone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="cp" *ngIf="value" dir="ltr">
      <span class="cp-text">{{ value }}</span>
      <button type="button" class="cp-btn" [class.cp-btn--done]="copied"
        [attr.aria-label]="copied ? 'Copied' : 'Copy phone number'"
        [title]="copied ? 'Copied!' : 'Copy phone'"
        (click)="copy($event)">
        <i class="fe cp-icon cp-icon--copy fe-copy"></i>
        <i class="fe cp-icon cp-icon--check fe-check"></i>
      </button>
    </span>
    <ng-container *ngIf="!value">{{ fallback }}</ng-container>
  `,
  styles: [`
    :host { display: inline-block; max-width: 100%; }
    .cp { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; }
    .cp-btn {
      position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; padding: 0; flex: 0 0 auto;
      border: 1px solid rgba(127, 127, 127, .35); border-radius: 7px;
      background: rgba(127, 127, 127, .08); color: inherit; cursor: pointer;
      font-size: 12px; line-height: 1; opacity: .65;
      transition: opacity .2s, transform .2s, background .2s, border-color .2s, color .2s, box-shadow .2s;
    }
    .cp:hover .cp-btn, .cp-btn:focus-visible { opacity: 1; }
    .cp-btn:hover { transform: translateY(-1px) scale(1.08); border-color: #3b82f6; color: #3b82f6; background: rgba(59, 130, 246, .12); }
    .cp-btn:active { transform: scale(.9); }
    .cp-icon { position: absolute; transition: transform .25s cubic-bezier(.34, 1.56, .64, 1), opacity .2s; }
    .cp-icon--check { opacity: 0; transform: scale(.3) rotate(-90deg); }
    .cp-btn--done, .cp-btn--done:hover {
      opacity: 1; color: #fff; background: #22c55e; border-color: #22c55e;
      animation: cp-pulse .6s ease-out;
    }
    .cp-btn--done .cp-icon--copy { opacity: 0; transform: scale(.3) rotate(90deg); }
    .cp-btn--done .cp-icon--check { opacity: 1; transform: scale(1) rotate(0); }
    @keyframes cp-pulse {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, .55); }
      100% { box-shadow: 0 0 0 9px rgba(34, 197, 94, 0); }
    }
  `]
})
export class CopyPhoneComponent implements OnDestroy {
  @Input() value: string | null | undefined = '';
  /** Shown instead when there is no number. */
  @Input() fallback = '-';

  copied = false;
  private timer: any;

  constructor(private cdr: ChangeDetectorRef) {}

  async copy(event: Event): Promise<void> {
    // The button sits inside clickable rows and links.
    event.stopPropagation();
    event.preventDefault();
    const text = String(this.value || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    this.copied = true;
    this.cdr.markForCheck();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.copied = false; this.cdr.markForCheck(); }, 1600);
  }

  ngOnDestroy(): void { clearTimeout(this.timer); }
}
