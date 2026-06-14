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

// Register only after the page loads, and only when the worker file exists.
if ('serviceWorker' in navigator && environment.production) {
  window.addEventListener('load', () => {
    fetch('/firebase-messaging-sw.js', { method: 'HEAD', cache: 'no-store' })
      .then((response) => {
        if (response.ok) {
          return navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }

        return undefined;
      })
      .catch(() => undefined);
  });
}
