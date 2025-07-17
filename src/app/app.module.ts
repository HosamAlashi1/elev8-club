import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DatePipe } from '@angular/common';
import { AuthInterceptor } from './interceptors/auth-interceptor';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
import { GoogleMapsModule } from '@angular/google-maps';
import { HotToastModule } from '@ngneat/hot-toast';



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
    InlineSVGModule.forRoot(),
    NgxSkeletonLoaderModule,
    ToastrModule.forRoot({
      preventDuplicates: true,
      closeButton: true,
      timeOut: 3000
    }),
    LottieModule.forRoot({ player: playerFactory }),
    GoogleMapsModule,
    HotToastModule.forRoot()
  ],
  providers: [
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
