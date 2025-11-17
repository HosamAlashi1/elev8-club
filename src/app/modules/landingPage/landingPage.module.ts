import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LandingPageComponent } from './landingPage.component';
import { HomeComponent } from './pages/home/home.component';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { ConfirmationDialogService } from './components/confirmation-dialog/confirmation-dialog.service';
import { InlineSVGModule } from 'ng-inline-svg-2';
// import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
// import { SharedModule } from './shared/shared.module';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
// import { LottieOverlayComponent } from './shared/lottie-overlay/lottie-overlay.component';
import { FooterComponent } from './layout/footer/footer.component';

import { LandingPageRoutingModule } from './landingPage-routing.module';
import { SharedModule } from '../dash/shared/shared.module';
import { LandingSharedModule } from './shared/landing-shared.module';
import { HeroSectionComponent } from './pages/home/sections/hero/hero-section/hero-section.component';
import { StatsSectionComponent } from './pages/home/sections/stats/stats-section/stats-section.component';
import { FeaturesSectionComponent } from './pages/home/sections/features/features-section/features-section.component';
import { BeforeAfterSectionComponent } from './pages/home/sections/before-after/before-after-section/before-after-section.component';
import { JourneySectionComponent } from './pages/home/sections/journey/journey-section/journey-section.component';
import { VideoTestimonialsSectionComponent } from './pages/home/sections/video-testimonials/video-testimonials-section/video-testimonials-section.component';
import { WrittenTestimonialsSectionComponent } from './pages/home/sections/written-testimonials/written-testimonials-section/written-testimonials-section.component';
import { SuitableCheckSectionComponent } from './pages/home/sections/suitable-check/suitable-check-section/suitable-check-section.component';
import { FaqSectionComponent } from './pages/home/sections/faq/faq-section/faq-section.component';
import { LeadsTickerComponent } from './pages/home/sections/leads-ticker/leads-ticker/leads-ticker.component';
import { RegisterPopupComponent } from './pages/home/sections/register-popup/register-popup/register-popup.component';
import { BigCtaSectionComponent } from './pages/home/sections/big-cta/big-cta-section/big-cta-section.component';
import { ContactSectionComponent } from './pages/home/sections/contact/contact-section/contact-section.component';
import { LucideAngularModule, GraduationCap, TrendingUp, Bot, MessageCircle, Globe, Trophy, Check, CheckCircle2, XCircle } from 'lucide-angular';




export function playerFactory() {
  return player;
}


@NgModule({
  declarations: [
    LandingPageComponent,
    HomeComponent,
    FooterComponent,
    HeroSectionComponent,
    StatsSectionComponent,
    FeaturesSectionComponent,
    BeforeAfterSectionComponent,
    JourneySectionComponent,
    VideoTestimonialsSectionComponent,
    WrittenTestimonialsSectionComponent,
    SuitableCheckSectionComponent,
    FaqSectionComponent,
    LeadsTickerComponent,
    RegisterPopupComponent,
    BigCtaSectionComponent,
    ContactSectionComponent,
    // NavbarComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    InlineSVGModule,
    NgxSkeletonLoaderModule,
    SharedModule,
    NgbDropdownModule,
    LandingPageRoutingModule,
    LottieModule.forRoot({ player: playerFactory }),
    LandingSharedModule,
     LucideAngularModule.pick({
      GraduationCap,
      TrendingUp,
      Bot,
      MessageCircle,
      Globe,
      Trophy,
      Check,
      CheckCircle2,
      XCircle
    })
  ],
  providers: [
    // ConfirmationDialogService
  ]
})
export class LandingPageModule { }
