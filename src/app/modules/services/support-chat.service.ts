import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  map,
  Observable,
  Subscription
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupportChat, SupportMessage } from '../../core/models';
import { NotificationSoundService } from './notification-sound.service';

interface MessageWriteResult {
  success: boolean;
  createdAt?: number;
}

@Injectable({ providedIn: 'root' })
export class SupportChatService {
  private readonly visitorStorageKey = `${environment.prefix}-support-visitor-id`;
  private readonly visitorIdPattern = /^[a-f0-9]{32}$/;
  private readonly unreadAdminSubject = new BehaviorSubject<number>(0);
  private readonly knownVisitorActivity = new Map<string, number>();
  private adminMonitoringSubscription?: Subscription;
  private adminMonitorReady = false;
  private readonly automaticReply =
    'شكرًا لتواصلك معنا ✨ وصلنا سؤالك، وسيتم الرد عليك قريبًا.';

  readonly unreadAdminCount$ = this.unreadAdminSubject.asObservable();

  constructor(
    private db: AngularFireDatabase,
    private sounds: NotificationSoundService,
    private toastr: ToastrService
  ) { }

  getStoredVisitorId(): string | null {
    try {
      const visitorId = localStorage.getItem(this.visitorStorageKey);
      return visitorId && this.visitorIdPattern.test(visitorId) ? visitorId : null;
    } catch {
      return null;
    }
  }

  getOrCreateVisitorId(): string {
    const existingId = this.getStoredVisitorId();
    if (existingId) return existingId;

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const visitorId = Array.from(bytes)
      .map(value => value.toString(16).padStart(2, '0'))
      .join('');

    try {
      localStorage.setItem(this.visitorStorageKey, visitorId);
    } catch {
      // The current page session can still use the id when storage is unavailable.
    }
    return visitorId;
  }

  observeVisitorChat(visitorId: string): Observable<SupportChat | null> {
    return this.db.object<Record<string, unknown>>(`support_chats/${visitorId}`)
      .valueChanges()
      .pipe(map(value => value ? this.normalizeChat(visitorId, value) : null));
  }

  observeAdminChats(): Observable<SupportChat[]> {
    return this.db.list<Record<string, unknown>>(
      'support_chats',
      ref => ref.orderByChild('lastMessageAt').limitToLast(150)
    ).snapshotChanges().pipe(
      map(changes => changes
        .map(change => this.normalizeChat(
          change.payload.key || '',
          change.payload.val() || {}
        ))
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      )
    );
  }

  async sendVisitorMessage(
    visitorId: string,
    text: string,
    pageUrl: string
  ): Promise<MessageWriteResult> {
    if (!this.visitorIdPattern.test(visitorId)) {
      throw new Error('Invalid visitor conversation id');
    }

    const cleanText = this.normalizeOutgoingText(text);
    const chatRef = this.db.database.ref(`support_chats/${visitorId}`);
    const snapshot = await chatRef.once('value');
    const existing = snapshot.val() || {};
    const isFirstMessage = !existing.createdAt;
    const messageKey = chatRef.child('messages').push().key;

    if (!messageKey) throw new Error('Could not create the message');

    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    const updates: Record<string, unknown> = {
      [`support_chats/${visitorId}/status`]: 'new',
      [`support_chats/${visitorId}/lastMessageAt`]: timestamp,
      [`support_chats/${visitorId}/lastVisitorMessageAt`]: timestamp,
      [`support_chats/${visitorId}/lastMessagePreview`]: cleanText.slice(0, 140),
      [`support_chats/${visitorId}/lastSender`]: 'visitor',
      [`support_chats/${visitorId}/unreadAdmin`]: Number(existing.unreadAdmin || 0) + 1,
      [`support_chats/${visitorId}/messages/${messageKey}`]: {
        text: cleanText,
        sender: 'visitor',
        createdAt: timestamp
      }
    };

    if (isFirstMessage) {
      updates[`support_chats/${visitorId}/visitorId`] = visitorId;
      updates[`support_chats/${visitorId}/createdAt`] = timestamp;
      updates[`support_chats/${visitorId}/pageUrl`] = pageUrl.slice(0, 500);
      updates[`support_chats/${visitorId}/messages/welcome`] = {
        text: this.automaticReply,
        sender: 'system',
        senderName: 'Elev8 Club',
        createdAt: timestamp
      };
    }

    await this.db.database.ref().update(updates);
    return { success: true, createdAt: Date.now() };
  }

  async replyToChat(visitorId: string, text: string): Promise<MessageWriteResult> {
    const cleanText = this.normalizeOutgoingText(text);
    const chatRef = this.db.database.ref(`support_chats/${visitorId}`);
    const snapshot = await chatRef.once('value');
    const existing = snapshot.val();
    const messageKey = chatRef.child('messages').push().key;

    if (!existing || !messageKey) throw new Error('Conversation was not found');

    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    const updates: Record<string, unknown> = {
      [`support_chats/${visitorId}/status`]: 'answered',
      [`support_chats/${visitorId}/lastMessageAt`]: timestamp,
      [`support_chats/${visitorId}/lastMessagePreview`]: cleanText.slice(0, 140),
      [`support_chats/${visitorId}/lastSender`]: 'admin',
      [`support_chats/${visitorId}/unreadAdmin`]: 0,
      [`support_chats/${visitorId}/unreadVisitor`]: Number(existing.unreadVisitor || 0) + 1,
      [`support_chats/${visitorId}/messages/${messageKey}`]: {
        text: cleanText,
        sender: 'admin',
        senderName: 'Elev8 Club',
        createdAt: timestamp
      }
    };

    await this.db.database.ref().update(updates);
    return { success: true, createdAt: Date.now() };
  }

  async markAsRead(visitorId: string, reader: 'admin' | 'visitor'): Promise<void> {
    const chatRef = this.db.database.ref(`support_chats/${visitorId}`);
    if (reader === 'visitor') {
      const snapshot = await chatRef.child('unreadVisitor').once('value');
      if (snapshot.exists() && Number(snapshot.val()) > 0) {
        await chatRef.child('unreadVisitor').set(0);
      }
      return;
    }

    const snapshot = await chatRef.once('value');
    const chat = snapshot.val();
    if (!chat) return;
    const updates: Record<string, unknown> = { unreadAdmin: 0 };
    if (chat.status === 'new') updates['status'] = 'open';
    await chatRef.update(updates);
  }

  requestVisitorNotificationPermission(): void {
    void this.sounds.requestBrowserPermission();
  }

  playSentSound(): void {
    this.sounds.playSent();
  }

  notifyVisitorAboutReply(body: string, onClick: () => void): void {
    this.sounds.playIncoming();
    this.sounds.showBrowserNotification('رد جديد من Elev8 Club', body, onClick);
  }

  startAdminMonitoring(onNotificationClick?: () => void): void {
    if (this.adminMonitoringSubscription) return;

    this.adminMonitoringSubscription = this.observeAdminChats().subscribe({
      next: chats => {
        this.unreadAdminSubject.next(
          chats.reduce((total, chat) => total + (chat.unreadAdmin || 0), 0)
        );

        const newVisitorActivity = chats.filter(chat => {
          const knownAt = this.knownVisitorActivity.get(chat.id) || 0;
          return chat.lastVisitorMessageAt > knownAt;
        });

        chats.forEach(chat => {
          this.knownVisitorActivity.set(chat.id, chat.lastVisitorMessageAt || 0);
        });

        if (this.adminMonitorReady && newVisitorActivity.length) {
          const latest = newVisitorActivity.sort(
            (a, b) => b.lastVisitorMessageAt - a.lastVisitorMessageAt
          )[0];
          this.sounds.playIncoming();
          this.toastr.info(latest.lastMessagePreview, 'New website question');
          this.sounds.showBrowserNotification(
            'New website question',
            latest.lastMessagePreview,
            onNotificationClick
          );
        }

        this.adminMonitorReady = true;
      },
      error: () => this.unreadAdminSubject.next(0)
    });
  }

  stopAdminMonitoring(): void {
    this.adminMonitoringSubscription?.unsubscribe();
    this.adminMonitoringSubscription = undefined;
    this.adminMonitorReady = false;
    this.knownVisitorActivity.clear();
    this.unreadAdminSubject.next(0);
  }

  private normalizeChat(
    id: string,
    value: Record<string, unknown>
  ): SupportChat {
    const rawMessages = (value['messages'] || {}) as Record<
      string,
      Omit<SupportMessage, 'id'>
    >;
    const messages = Object.entries(rawMessages)
      .map(([messageId, message]) => ({ id: messageId, ...message }))
      .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

    return {
      id,
      visitorId: String(value['visitorId'] || id),
      status: value['status'] === 'answered' || value['status'] === 'open'
        ? value['status']
        : 'new',
      createdAt: Number(value['createdAt']) || 0,
      lastMessageAt: Number(value['lastMessageAt']) || 0,
      lastVisitorMessageAt: Number(value['lastVisitorMessageAt']) || 0,
      lastMessagePreview: String(value['lastMessagePreview'] || ''),
      lastSender: value['lastSender'] === 'admin' || value['lastSender'] === 'system'
        ? value['lastSender']
        : 'visitor',
      unreadAdmin: Number(value['unreadAdmin']) || 0,
      unreadVisitor: Number(value['unreadVisitor']) || 0,
      messageCount: Number(value['messageCount']) || messages.length,
      pageUrl: value['pageUrl'] ? String(value['pageUrl']) : undefined,
      messages
    };
  }

  private normalizeOutgoingText(value: string): string {
    const text = value
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length < 2 || text.length > 1000) {
      throw new Error('Message must be between 2 and 1000 characters');
    }
    return text;
  }
}
