import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const bootstrap = async () => {
  try {
    return await platformBrowserDynamic().bootstrapModule(AppModule);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

bootstrap();

// Enable Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .catch(() => { });
}