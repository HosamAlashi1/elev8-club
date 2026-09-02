import {
  AfterViewChecked,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SupportMessage } from '../../../../core/models';
import { SupportChatService } from '../../../services/support-chat.service';

@Component({
  selector: 'app-support-chat-widget',
  templateUrl: './support-chat-widget.component.html',
  styleUrls: ['./support-chat-widget.component.css']
})
export class SupportChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesViewport') messagesViewport?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;

  isOpen = false;
  isSending = false;
  draft = '';
  errorMessage = '';
  unreadCount = 0;
  messages: SupportMessage[] = [];

  private visitorId: string | null = null;
  private chatSubscription?: Subscription;
  private listenerInitialized = false;
  private knownMessageIds = new Set<string>();
  private shouldScroll = false;
  private markingRead = false;

  constructor(
    private supportChat: SupportChatService,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.visitorId = this.supportChat.getStoredVisitorId();
    if (this.visitorId) this.listenToConversation(this.visitorId);
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScroll || !this.messagesViewport) return;
    const viewport = this.messagesViewport.nativeElement;
    viewport.scrollTop = viewport.scrollHeight;
    this.shouldScroll = false;
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.errorMessage = '';

    if (this.isOpen) {
      this.unreadCount = 0;
      this.shouldScroll = true;
      this.markVisitorMessagesAsRead();
      setTimeout(() => this.messageInput?.nativeElement.focus(), 260);
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.draft.trim();
    if (text.length < 2 || this.isSending) return;

    const isFirstMessage = !this.messages.some(message => message.sender === 'visitor');
    if (isFirstMessage) {
      this.supportChat.requestVisitorNotificationPermission();
    }

    this.visitorId ??= this.supportChat.getOrCreateVisitorId();
    if (!this.chatSubscription) this.listenToConversation(this.visitorId);

    this.isSending = true;
    this.errorMessage = '';

    try {
      await this.supportChat.sendVisitorMessage(
        this.visitorId,
        text,
        window.location.href
      );
      this.draft = '';
      this.shouldScroll = true;
      this.supportChat.playSentSound();
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code.includes('resource-exhausted')) {
        this.errorMessage = 'أرسل بهدوء قليلًا، ثم جرّب مرة أخرى.';
      } else if (code.includes('not-found') || code.includes('unavailable')) {
        this.errorMessage = 'خدمة المحادثة غير متاحة الآن. حاول بعد قليل.';
      } else {
        this.errorMessage = 'لم نتمكن من إرسال رسالتك. تأكد من الإنترنت وحاول مجددًا.';
      }
      console.error('Support chat send failed', error);
    } finally {
      this.isSending = false;
      setTimeout(() => this.messageInput?.nativeElement.focus());
    }
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void this.sendMessage();
  }

  formatMessageTime(timestamp: number): string {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('ar', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  trackMessage(_: number, message: SupportMessage): string {
    return message.id;
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
  }

  private listenToConversation(visitorId: string): void {
    this.chatSubscription = this.supportChat.observeVisitorChat(visitorId)
      .subscribe({
        next: chat => {
          const nextMessages = chat?.messages || [];
          const newAdminMessages = nextMessages.filter(message =>
            message.sender === 'admin' && !this.knownMessageIds.has(message.id)
          );

          this.messages = nextMessages;
          nextMessages.forEach(message => this.knownMessageIds.add(message.id));
          this.shouldScroll = this.isOpen;

          if (this.listenerInitialized && newAdminMessages.length) {
            const latestReply = newAdminMessages[newAdminMessages.length - 1];
            this.supportChat.notifyVisitorAboutReply(
              latestReply.text,
              () => this.zone.run(() => this.openFromNotification())
            );
          }

          this.unreadCount = this.isOpen ? 0 : Number(chat?.unreadVisitor || 0);
          if (this.isOpen && Number(chat?.unreadVisitor || 0) > 0) {
            this.markVisitorMessagesAsRead();
          }
          this.listenerInitialized = true;
        },
        error: () => {
          this.chatSubscription = undefined;
          this.listenerInitialized = false;
          this.errorMessage = 'تعذر تحميل المحادثة الآن.';
        }
      });
  }

  private openFromNotification(): void {
    if (!this.isOpen) this.toggleChat();
  }

  private markVisitorMessagesAsRead(): void {
    if (!this.visitorId || this.markingRead) return;
    this.markingRead = true;
    this.supportChat.markAsRead(this.visitorId, 'visitor')
      .catch(() => undefined)
      .finally(() => this.markingRead = false);
  }
}
