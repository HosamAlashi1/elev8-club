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
  @Input() lead!: Lead;

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

  get hasChat(): boolean {
    return !!this.lead?.telegramChatId;
  }

  send(): void {
    this.submitted = true;
    if (this.isEmpty || this.isSending || !this.lead?.key) return;
    if (!confirm(`Send this message to ${this.lead.fullName}?`)) return;

    this.isSending = true;
    this.botMessage.sendMessage(this.lead.key, this.html)
      .then(() => {
        this.toastr.showSuccess('Message sent');
        this.activeModal.close(true);
      })
      .catch(err => {
        console.error('Bot send-message failed:', err);
        this.toastr.showError('Could not send the message. Nothing was sent.');
      })
      .finally(() => this.isSending = false);
  }
}
