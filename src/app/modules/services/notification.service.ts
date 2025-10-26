import { ToastrsService } from 'src/app/modules/services/toater.service';
import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

const app = initializeApp(environment.firebase);

@Injectable({
    providedIn: 'root',
})
export class NotificationService {

    private notificationSubject = new BehaviorSubject<any>(null);
    public notifications$ = this.notificationSubject.asObservable();

    constructor(private toastrsService: ToastrsService) { }

    sendNotification(notification: any) {
        this.notificationSubject.next(notification);
    }

    async requestPermission(): Promise<void> {
        try {
            
            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const fcmToken = await getToken(messaging, {
                    vapidKey: environment.firebase.vapidKey,
                });
                localStorage.setItem(`${environment.prefix}-fcm-token`, fcmToken);
            } else {
                console.error('Notifications Permission was not granted.');
            }
        } catch (error) {
            console.error('Error while requesting FCM token:', error);
        }
    }

    listenNotifications() {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {            
            const title = payload?.data?.title || 'New Notification';
            const body = payload?.data?.body || 'You have a new message.';
            this.toastrsService.showInfo(body, title);
            this.sendNotification(payload?.data);
            this.playNotificationSound();
            this.updateTitle();
        });
    }

    private playNotificationSound() {
        const audio = new Audio('/assets/sounds/notification.mp3');
        audio.preload = 'auto';

        audio.play().catch((error) => {
            console.error('Error playing notification sound:', error);
        });
    }

    private updateTitle() {
        const match = document.title.match(/\((\d+)\)/);
        let newCount = 1;

        if (match) {
            newCount = parseInt(match[1], 10) + 1;
        }

        const baseTitle = document.title.replace(/\(\d+\)\s*/, '');
        document.title = `(${newCount}) ${baseTitle}`;
    }
}
