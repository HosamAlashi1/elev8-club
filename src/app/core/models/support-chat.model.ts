export type SupportMessageSender = 'visitor' | 'admin' | 'system';
export type SupportChatStatus = 'new' | 'open' | 'answered';

export interface SupportMessage {
  id: string;
  text: string;
  sender: SupportMessageSender;
  senderName?: string;
  createdAt: number;
}

export interface SupportChat {
  id: string;
  visitorId: string;
  status: SupportChatStatus;
  createdAt: number;
  lastMessageAt: number;
  lastVisitorMessageAt: number;
  lastMessagePreview: string;
  lastSender: SupportMessageSender;
  unreadAdmin: number;
  unreadVisitor: number;
  messageCount: number;
  pageUrl?: string;
  messages: SupportMessage[];
}
