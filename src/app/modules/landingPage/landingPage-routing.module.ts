import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { CartStepComponent } from './pages/orders/steps/cart-step/cart-step.component';
import { DetailsStepComponent } from './pages/orders/steps/details-step/details-step.component';
import { PaymentStepComponent } from './pages/orders/steps/payment-step/payment-step.component';
import { ConfirmationStepComponent } from './pages/orders/steps/confirmation-step/confirmation-step.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'EDKD - Home',
  },
  {
    path: 'orders',
    component: OrdersComponent,
    children: [
      { path: '', redirectTo: 'cart', pathMatch: 'full' },
      { path: 'cart', component: CartStepComponent },
      { path: 'details', component: DetailsStepComponent },
      { path: 'payment', component: PaymentStepComponent },
      { path: 'confirmation/:id', component: ConfirmationStepComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandingPageRoutingModule { }
