import { initializeApp } from 'firebase/app';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DatePipe } from '@angular/common';
import { AuthInterceptor } from './interceptors/auth-interceptor';
import { GoogleMapsModule } from '@angular/google-maps';
import { TranslateModule } from '@ngx-translate/core';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
import { SharedModule } from './modules/dash/shared/shared.module';

import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { PublicSharedModule } from './modules/shared/public-shared.module';


export function playerFactory() {
  return player;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    NgbModule,
    BrowserAnimationsModule,
    SharedModule,
    PublicSharedModule,
    InlineSVGModule.forRoot(),
    NgxSkeletonLoaderModule,
    ToastrModule.forRoot({
      preventDuplicates: true,
      closeButton: true,
      timeOut: 3000
    }),
    GoogleMapsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en'
    }),
    LottieModule.forRoot({ player: playerFactory }),
    AngularFireModule.initializeApp(environment.firebase)
    // AngularFireDatabaseModule,
    // AngularFireStorageModule,
  ],
  providers: [
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
