import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AccountVerificationDecision } from '../../core/models';

interface UpdateAccountStatusRequest {
  telegram_chat_id: number;
  status: AccountVerificationDecision;
}

/**
 * Accepts or rejects a v2 lead's trading account.
 *
 * ## Why this is an HTTP call and not a Firebase write
 *
 * Every other bot field in the lead record is read-only here — the bot's backend writes them and
 * the dashboard displays them. `accountVerificationStatus` is the one the dashboard changes, and
 * it goes through the bot's own API rather than `leads/{key}` because flipping it is not just a
 * data change: the bot has to move the lead off step 6 ("جاري التحقق…") and message them. Writing
 * to Firebase directly would change the dashboard's view while leaving the lead sitting in a bot
 * conversation that never advances.
 *
 * The lead's own record is therefore NOT updated here. It updates when the bot's backend writes
 * back, which is also what proves the call actually took effect — see LeadSalesPanelComponent.
 */
@Injectable({
  providedIn: 'root'
})
export class BotAccountService {
  constructor(private http: HttpClient) { }

  /**
   * `telegramChatId` is the bot's own identifier for the lead, not ours — it only exists once
   * the lead has actually opened the bot. A lead who never did cannot be decided on, which the
   * caller must check before offering the buttons.
   */
  updateAccountStatus(telegramChatId: number, status: AccountVerificationDecision): Promise<unknown> {
    const body: UpdateAccountStatusRequest = {
      telegram_chat_id: telegramChatId,
      status
    };

    return firstValueFrom(
      this.http.post(`${environment.botApiUrl}/freebot/update-account-status`, body)
    );
  }
}
