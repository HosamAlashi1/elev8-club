import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashComponent } from './dash.component';

const routes: Routes = [
  {
    path: '',
    component: DashComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        title: 'Dashboard | EDKD',
        data: { animation: 'dashPage' }
      },
      {
        path: 'admins',
        loadChildren: () =>
          import('./pages/admins/admins.module').then((m) => m.AdminsModule),
        title: 'Admins | EDKD',
        data: { animation: 'adminsPage' }
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./pages/orders/orders.module').then((m) => m.OrdersModule),
        title: 'Orders | EDKD',
        data: { animation: 'ordersPage' }
      },
      {
        path: 'tutorial',
        loadChildren: () =>
          import('./pages/tutorial/tutorial.module').then((m) => m.TutorialModule),
        title: 'Tutorial | EDKD',
        data: { animation: 'tutorialPage' }
      },
      {
        path: 'packages',
        loadChildren: () =>
          import('./pages/packages/packages.module').then((m) => m.PackagesModule),
        title: 'Packages | EDKD',
        data: { animation: 'packagesPage' }
      },
      {
        path: 'package-features',
        loadChildren: () =>
          import('./pages/package-features/package-features.module').then((m) => m.PackageFeaturesModule),
        title: 'Package Features | EDKD',
        data: { animation: 'packageFeaturesPage' }
      }, 
      {
        path: 'payment-methods',
        loadChildren: () =>
          import('./pages/payment-methods/payment-methods.module').then((m) => m.PaymentMethodsModule),
        title: 'Payment Methods | EDKD',
        data: { animation: 'paymentMethodsPage' }
      },
      {
        path: 'app-preview',
        loadChildren: () =>
          import('./pages/companies/companies.module').then((m) => m.CompaniesModule),
        title: 'App Previews | EDKD',
        data: { animation: 'previewsPage' }
      },
      {
        path: 'features',
        loadChildren: () =>
          import('./pages/features/features.module').then((m) => m.FeaturesModule),
        title: 'Features | EDKD',
        data: { animation: 'featuresPage' }
      },
      {
        path: 'processes',
        loadChildren: () =>
          import('./pages/process/process.module').then((m) => m.ServicesModule),
        title: 'Processes | EDKD',
        data: { animation: 'processesPage' }
      },
      {
        path: 'testimonials',
        loadChildren: () =>
          import('./pages/testimonials/testimonials.module').then((m) => m.TestimonialsModule),
        title: 'Testimonials | EDKD',
        data: { animation: 'testimonialsPage' }
      },
      {
        path: 'contact-messages',
        loadChildren: () =>
          import('./pages/contact_messages/contact_messages.module').then((m) => m.ContactMessagesModule),
        title: 'Contact Messages | EDKD',
        data: { animation: 'contactMessagesPage' }
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.module').then((m) => m.SettingsModule),
        title: 'Settings | EDKD',
        data: { animation: 'settingsPage' }
      },
      { path: '', redirectTo: '', pathMatch: 'full' },
      { path: '**', redirectTo: '' },
    ],
  },
];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashRoutingModule { }
