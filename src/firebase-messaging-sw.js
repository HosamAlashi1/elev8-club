importScripts(
  "https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
 apiKey: "AIzaSyAPX-kca3_cIjki2AIEg8mi5MUJUbGz8_8",
  authDomain: "dorrance-audio.firebaseapp.com",
  projectId: "dorrance-audio",
  storageBucket: "dorrance-audio.firebasestorage.app",
  messagingSenderId: "1044486499990",
  appId: "1:1044486499990:web:bb16a44aaed6f409991cb7",
  measurementId: "G-ZCFC8J61Q5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(async (payload) => {
  const data = payload?.data || {};
  const title = data.title || "New Notification";

  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  const hasVisible = clientsList.some((c) => c.visibilityState === "visible");
  if (hasVisible) return;

  const options = {
    body: data.body || "You have a new message.",
    icon: data.icon || "/assets/img/landing/logo.png",
    image: data.image || undefined,
    badge: "/assets/img/landing/logo.png",
    requireInteraction: true,
    tag: data.tag || "Dorrance_general",
    renotify: false,
    data,
    actions: [],
  };

  if (data.action_text) {
    options.actions.push({
      action: data.action_url || "/",
      title: data.action_text,
    });
  }

  await self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.action ||
    event.notification?.data?.action_url ||
    self.location.origin;

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })()
  );
});
