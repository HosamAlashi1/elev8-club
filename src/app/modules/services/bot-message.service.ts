import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

interface SendMessageRequest {
  lead_ids: string[];
  message_html: string;
}

/**
 * Sends a message to a lead through the bot's own API (the same TMS_Backend as BotAccountService).
 *
 * The bot owns the conversation, so the message goes through it rather than being written to Firebase: it delivers
 * it in the lead's Telegram chat. `message_html` is the editor's HTML as it is.
 */
@Injectable({
  providedIn: 'root'
})
export class BotMessageService {
  constructor(private http: HttpClient) { }

  /** `leadIds` are the leads' record keys (leads/{key}); the bot finds each lead (and its chat) by it. One call can carry many leads. */
  sendMessage(leadIds: string[], messageHtml: string): Promise<unknown> {
    const body: SendMessageRequest = { lead_ids: leadIds, message_html: messageHtml };
    return firstValueFrom(this.http.post(`${environment.botApiUrl}/FreeBot/send-message`, body));
  }
}
