import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LandingPageComponent } from './landingPage.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { ConfirmationDialogService } from './components/confirmation-dialog/confirmation-dialog.service';
import { InlineSVGModule } from 'ng-inline-svg-2';
// import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
// import { SharedModule } from './shared/shared.module';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
// import { LottieOverlayComponent } from './shared/lottie-overlay/lottie-overlay.component';
import { FooterComponent } from './sections/footer/footer.component';
import { NavbarComponent } from './sections/navbar/navbar.component';
import { HeroComponent } from './sections/hero/hero.component';
import { SolutionComponent } from './sections/solution/solution.component';
import { ProcessComponent } from './sections/process/process.component';
import { FeaturesComponent } from './sections/features/features.component';
import { AppPreviewComponent } from './sections/app-preview/app-preview.component';
import { MetricsComponent } from './sections/metrics/metrics.component';
import { TestimonialsComponent } from './sections/testimonials/testimonials.component';
import { CtaComponent } from './sections/cta/cta.component';
import { ContactComponent } from './sections/contact/contact.component';
import { LandingPageRoutingModule } from './landingPage-routing.module';



export function playerFactory() {
  return player;
}


@NgModule({
  declarations: [
    LandingPageComponent,
    FooterComponent,
    NavbarComponent,
    HeroComponent,
    SolutionComponent,
    ProcessComponent,
    FeaturesComponent,
    AppPreviewComponent,
    MetricsComponent,
    TestimonialsComponent,
    CtaComponent,
    ContactComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    InlineSVGModule,
    NgxSkeletonLoaderModule,
    // SharedModule,
    LandingPageRoutingModule,
    LottieModule.forRoot({ player: playerFactory })
  ],
  providers: [
    // ConfirmationDialogService
  ]
})
export class LandingPageModule { }
