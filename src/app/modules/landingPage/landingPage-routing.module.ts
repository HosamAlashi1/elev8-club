import { AuthGuard } from './../auth/guards/auth.guard';
// landingPage-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingPageComponent } from './landingPage.component';

import { HomeComponent } from './pages/home/home.component';
import { ShopComponent } from './pages/shop/shop.component';
import { BookDetailsComponent } from './pages/book-details/book-details.component';
import { AuthorsComponent } from './pages/authors/authors.component';
import { AuthorEventsComponent } from './pages/author-events/author-events.component';
import { BecomeAuthorComponent } from './pages/become-author/become-author.component';


import { CartComponent } from './pages/orders/cart/cart.component';
import { ShippingDetailsComponent } from './pages/orders/shipping-details/shipping-details.component';
import { ConfirmationComponent } from './pages/orders/confirmation/confirmation.component';
import { CartGuard } from './guards/cart.guard';
import { DetailsGuard } from './guards/details.guard';
import { LandingAuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent, // الـ layout الرئيسي
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: HomeComponent,
        data: { animation: 'HomePage' }
      },
      {
        path: 'shop',
        component: ShopComponent,
        data: { animation: 'ShopPage' }
      },
      {
        path: 'book/:id',
        component: BookDetailsComponent,
        data: { animation: 'BookDetailsPage' }
      },
      {
        path: 'featured-author',
        component: AuthorsComponent,
        data: { animation: 'AuthorsPage' }
      },
      {
        path: 'author-events',
        component: AuthorEventsComponent,
        data: { animation: 'EventsPage' }
      },
      {
        path: 'become-author',
        component: BecomeAuthorComponent,
        data: { animation: 'BecomeAuthorPage' }
      },
      { path: 'cart', component: CartComponent, data: { animation: 'CartPage' }, canActivate: [LandingAuthGuard,CartGuard] },
      { path: 'shipping-details', component: ShippingDetailsComponent, data: { animation: 'ShippingDetailsPage' }, canActivate: [LandingAuthGuard,DetailsGuard] },
      { path: 'confirmation/:orderId', component: ConfirmationComponent, data: { animation: 'ConfirmationPage' } , canActivate: [LandingAuthGuard]},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandingPageRoutingModule { }
