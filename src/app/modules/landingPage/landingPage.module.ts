import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './pages/home/home.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { ConfirmationDialogService } from './components/confirmation-dialog/confirmation-dialog.service';
import { InlineSVGModule } from 'ng-inline-svg-2';
// import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
// import { SharedModule } from './shared/shared.module';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
// import { LottieOverlayComponent } from './shared/lottie-overlay/lottie-overlay.component';
import { FooterComponent } from './layout/footer/footer.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { HeroComponent } from './pages/home/sections/hero/hero.component';
import { SolutionComponent } from './pages/home/sections/solution/solution.component';
import { ProcessComponent } from './pages/home/sections/process/process.component';
import { FeaturesComponent } from './pages/home/sections/features/features.component';
import { AppPreviewComponent } from './pages/home/sections/app-preview/app-preview.component';
import { MetricsComponent } from './pages/home/sections/metrics/metrics.component';
import { TestimonialsComponent } from './pages/home/sections/testimonials/testimonials.component';
import { CtaComponent } from './pages/home/sections/cta/cta.component';
import { ContactComponent } from './pages/home/sections/contact/contact.component';
import { LandingPageRoutingModule } from './landingPage-routing.module';
import { OrderDemoComponent } from './pages/home/sections/order-demo/order-demo.component';
import { TutorialComponent } from './pages/home/sections/tutorial/tutorial.component';
import { CartStepComponent } from './pages/orders/steps/cart-step/cart-step.component';
import { DetailsStepComponent } from './pages/orders/steps/details-step/details-step.component';
import { PaymentStepComponent } from './pages/orders/steps/payment-step/payment-step.component';
import { ConfirmationStepComponent } from './pages/orders/steps/confirmation-step/confirmation-step.component';



export function playerFactory() {
  return player;
}


@NgModule({
  declarations: [
    HomeComponent,
    OrdersComponent,
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
    ContactComponent,
    OrderDemoComponent,
    TutorialComponent,
    CartStepComponent,
    DetailsStepComponent,
    PaymentStepComponent,
    ConfirmationStepComponent
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
