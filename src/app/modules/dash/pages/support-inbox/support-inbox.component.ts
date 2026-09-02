import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { SupportChat, SupportChatStatus, SupportMessage } from '../../../../core/models';
import { SupportChatService } from '../../../services/support-chat.service';

type InboxFilter = 'all' | SupportChatStatus;

@Component({
  selector: 'app-support-inbox',
  templateUrl: './support-inbox.component.html',
  styleUrls: ['./support-inbox.component.css']
})
export class SupportInboxComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('conversationViewport') conversationViewport?: ElementRef<HTMLElement>;
  @ViewChild('replyInput') replyInput?: ElementRef<HTMLTextAreaElement>;

  chats: SupportChat[] = [];
  selectedChatId: string | null = null;
  searchText = '';
  activeFilter: InboxFilter = 'all';
  replyDraft = '';
  isLoading = true;
  isReplying = false;

  private chatsSubscription?: Subscription;
  private lastRenderedMessageId = '';
  private shouldScroll = false;
  private markingReadChatId: string | null = null;

  readonly filters: Array<{ value: InboxFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'open', label: 'Open' },
    { value: 'answered', label: 'Answered' }
  ];

  constructor(
    private supportChat: SupportChatService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.chatsSubscription = this.supportChat.observeAdminChats().subscribe({
      next: chats => {
        this.chats = chats;
        this.isLoading = false;

        if (this.selectedChatId && !chats.some(chat => chat.id === this.selectedChatId)) {
          this.selectedChatId = null;
        }
        if (!this.selectedChatId && chats.length) {
          this.selectChat(chats[0]);
        }

        const selectedMessages = this.selectedChat?.messages || [];
        const latestMessage = selectedMessages[selectedMessages.length - 1];
        if (latestMessage?.id && latestMessage.id !== this.lastRenderedMessageId) {
          this.lastRenderedMessageId = latestMessage.id;
          this.shouldScroll = true;
        }

        if (this.selectedChat?.unreadAdmin) this.markSelectedChatAsRead();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error(
          'Realtime access was denied. Refresh your admin session and try again.',
          'Could not load website questions'
        );
      }
    });
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScroll || !this.conversationViewport) return;
    const viewport = this.conversationViewport.nativeElement;
    viewport.scrollTop = viewport.scrollHeight;
    this.shouldScroll = false;
  }

  get selectedChat(): SupportChat | null {
    return this.chats.find(chat => chat.id === this.selectedChatId) || null;
  }

  get filteredChats(): SupportChat[] {
    const query = this.searchText.trim().toLowerCase();
    return this.chats.filter(chat => {
      const matchesFilter = this.activeFilter === 'all' || chat.status === this.activeFilter;
      const matchesSearch = !query ||
        chat.id.toLowerCase().includes(query) ||
        chat.lastMessagePreview.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }

  get totalUnread(): number {
    return this.chats.reduce((total, chat) => total + (chat.unreadAdmin || 0), 0);
  }

  selectChat(chat: SupportChat): void {
    this.selectedChatId = chat.id;
    this.replyDraft = '';
    this.shouldScroll = true;
    this.markSelectedChatAsRead();
    setTimeout(() => this.replyInput?.nativeElement.focus(), 150);
  }

  closeConversationOnMobile(): void {
    this.selectedChatId = null;
  }

  setFilter(filter: InboxFilter): void {
    this.activeFilter = filter;
  }

  async sendReply(): Promise<void> {
    const chat = this.selectedChat;
    const text = this.replyDraft.trim();
    if (!chat || text.length < 2 || this.isReplying) return;

    this.isReplying = true;
    try {
      await this.supportChat.replyToChat(chat.id, text);
      this.replyDraft = '';
      this.shouldScroll = true;
      this.supportChat.playSentSound();
    } catch (error: any) {
      this.toastr.error(error?.message || 'Reply could not be sent');
    } finally {
      this.isReplying = false;
      setTimeout(() => this.replyInput?.nativeElement.focus());
    }
  }

  onReplyKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void this.sendReply();
  }

  visitorLabel(chat: SupportChat): string {
    return `Visitor ${chat.id.slice(-6).toUpperCase()}`;
  }

  formatRelative(timestamp: number): string {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 45) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
      .format(new Date(timestamp));
  }

  formatMessageTime(timestamp: number): string {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  formatConversationDate(timestamp: number): string {
    return new Intl.DateTimeFormat('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp));
  }

  trackChat(_: number, chat: SupportChat): string {
    return chat.id;
  }

  trackMessage(_: number, message: SupportMessage): string {
    return message.id;
  }

  ngOnDestroy(): void {
    this.chatsSubscription?.unsubscribe();
  }

  private markSelectedChatAsRead(): void {
    const chat = this.selectedChat;
    if (!chat?.unreadAdmin || this.markingReadChatId === chat.id) return;

    this.markingReadChatId = chat.id;
    this.supportChat.markAsRead(chat.id, 'admin')
      .catch(() => undefined)
      .finally(() => this.markingReadChatId = null);
  }
}
