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
import { NavbarComponent } from './layout/navbar/navbar.component';
import { TestimonialsComponent } from './pages/home/sections/testimonials/testimonials.component';
import { ContactComponent } from './pages/home/sections/contact/contact.component';
import { LandingPageRoutingModule } from './landingPage-routing.module';
import { SharedModule } from '../dash/shared/shared.module';
import { HeroComponent } from './pages/home/sections/hero/hero.component';
import { IntroTrustComponent } from './pages/home/sections/intro-trust/intro-trust.component';
import { FeaturedBooksComponent } from './pages/home/sections/featured-books/featured-books.component';
import { CategoriesComponent } from './pages/home/sections/categories/categories.component';
import { BestsellingComponent } from './pages/home/sections/bestselling/bestselling.component';
import { StaffPicksComponent } from './pages/home/sections/staff-picks/staff-picks.component';
import { AwardWinnersComponent } from './pages/home/sections/award-winners/award-winners.component';
import { NewsletterComponent } from './pages/home/sections/newsletter/newsletter.component';
import { BlogComponent } from './pages/home/sections/blog/blog.component';
import { ShopComponent } from './pages/shop/shop.component';
import { BookDetailsComponent } from './pages/book-details/book-details.component';
import { AuthorsComponent } from './pages/authors/authors.component';
import { AuthorEventsComponent } from './pages/author-events/author-events.component';
import { BecomeAuthorComponent } from './pages/become-author/become-author.component';
import { CartComponent } from './pages/orders/cart/cart.component';
import { ShippingDetailsComponent } from './pages/orders/shipping-details/shipping-details.component';
import { ConfirmationComponent } from './pages/orders/confirmation/confirmation.component';
import { OrderSummaryComponent } from './pages/orders/order-summary/order-summary.component';
import { EventsHeroComponent } from './pages/author-events/sections/events-hero/events-hero.component';
import { FeaturedEventComponent } from './pages/author-events/sections/featured-event/featured-event.component';
import { EventsCalendarComponent } from './pages/author-events/sections/events-calendar/events-calendar.component';
import { UpcomingEventsComponent } from './pages/author-events/sections/upcoming-events/upcoming-events.component';
import { PastEventsComponent } from './pages/author-events/sections/past-events/past-events.component';
import { HowItWorksComponent } from './pages/become-author/sections/how-it-works/how-it-works.component';
import { HeroBecomeAuthorComponent } from './pages/become-author/sections/become-author-hero/become-author-hero.component';
import { FreeGuideFormComponent } from './pages/become-author/sections/free-guide-form/free-guide-form.component';
import { ChooseUsComponent } from './pages/become-author/sections/choose-us/choose-us.component';
import { SuccessStoriesComponent } from './pages/become-author/sections/success-stories/success-stories.component';
import { FaqComponent } from './pages/become-author/sections/faq/faq.component';
import { LandingSharedModule } from './shared/landing-shared.module';



export function playerFactory() {
  return player;
}


@NgModule({
  declarations: [
    LandingPageComponent,
    HomeComponent,
    FooterComponent,
    NavbarComponent,
    TestimonialsComponent,
    ContactComponent,
    HeroComponent,
    IntroTrustComponent,
    FeaturedBooksComponent,
    CategoriesComponent,
    BestsellingComponent,
    StaffPicksComponent,
    AwardWinnersComponent,
    NewsletterComponent,
    BlogComponent,
    ShopComponent,
    BookDetailsComponent,
    AuthorsComponent,
    AuthorEventsComponent,
    BecomeAuthorComponent,
    CartComponent,
    ShippingDetailsComponent,
    ConfirmationComponent,
    OrderSummaryComponent,
    EventsHeroComponent,
    FeaturedEventComponent,
    EventsCalendarComponent,
    UpcomingEventsComponent,
    PastEventsComponent,
    HowItWorksComponent,
    FreeGuideFormComponent,
    ChooseUsComponent,
    SuccessStoriesComponent,
    FaqComponent,
    HeroBecomeAuthorComponent
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
    LandingSharedModule
  ],
  providers: [
    // ConfirmationDialogService
  ]
})
export class LandingPageModule { }
