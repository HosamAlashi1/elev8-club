import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorRoutingModule } from './error-routing.module';
import { ErrorComponent } from '../error/error.component';
import { Error404Component } from './error404/error404.component';
import { Error500Component } from './error500/error500.component';
import { Error503Component } from './error503/error503.component';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';

export function playerFactory() {
  return player;
}

@NgModule({
  declarations: [
    ErrorComponent,
    Error404Component,
    Error500Component,
    Error503Component
  ],
  imports: [
    CommonModule,
    ErrorRoutingModule,
    LottieModule.forRoot({ player: playerFactory })
  ]
})
export class ErrorModule { }
