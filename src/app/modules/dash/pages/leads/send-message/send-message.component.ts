import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Lead } from '../../../../../core/models';
import { BotMessageService } from '../../../../services/bot-message.service';
import { ToastrsService } from '../../../../services/toater.service';

/**
 * "Send message" — a rich-text message to a free-community (v2) or offer (v3) lead, delivered by the bot.
 * Opened from the leads table's row menu.
 */
@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.css']
})
export class SendMessageComponent {
  /** One or many: the row menu passes one, the table's selection passes all that are ticked. */
  @Input() leads: Lead[] = [];

  html = '';
  isSending = false;
  submitted = false;

  /** The toolbar offers what a chat message can carry. */
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    public activeModal: NgbActiveModal,
    private botMessage: BotMessageService,
    private toastr: ToastrsService
  ) { }

  /** Quill leaves an empty paragraph in an empty editor. */
  get isEmpty(): boolean {
    const text = (this.html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return !text;
  }

  get single(): Lead | null { return this.leads.length === 1 ? this.leads[0] : null; }

  /** Leads that have not opened the bot — it can only message someone who has. */
  get withoutChat(): number {
    return this.leads.filter(l => !l.telegramChatId).length;
  }

  send(): void {
    this.submitted = true;
    const keys = this.leads.map(l => l.key).filter((k): k is string => !!k);
    if (this.isEmpty || this.isSending || !keys.length) return;
    if (!confirm(keys.length === 1 ? `Send this message to ${this.leads[0].fullName}?` : `Send this message to ${keys.length} leads?`)) return;

    this.isSending = true;
    this.botMessage.sendMessage(keys, this.html)
      .then(() => {
        this.toastr.showSuccess(keys.length === 1 ? 'Message sent' : `Message sent to ${keys.length} leads`);
        this.activeModal.close(true);
      })
      .catch(err => {
        console.error('Bot send-message failed:', err);
        this.toastr.showError('Could not send the message. Nothing was sent.');
      })
      .finally(() => this.isSending = false);
  }
}
