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
        title: 'Dashboard | Dorrance',
        data: { animation: 'dashPage' }
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./pages/orders_Managment/orders.module').then((m) => m.OrdersModule),
        title: 'Orders | Dorrance',
        data: { animation: 'ordersPage' }
      },
      {
        path: 'testimonials',
        loadChildren: () =>
          import('./pages/testimonials/testimonials.module').then((m) => m.TestimonialsModule),
        title: 'Testimonials | Dorrance',
        data: { animation: 'testimonialsPage' }
      },
      {
        path: 'catalog',
        loadChildren: () =>
          import('./pages/catalog/catalog.module').then((m) => m.CatalogModule),
        title: 'Catalog | Dorrance',
        data: { animation: 'catalogPage' }
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./pages/customers/customers.module').then((m) => m.CustomersModule),
        title: 'Customers | Dorrance',
        data: { animation: 'customersPage' }
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./pages/reports/reports.module').then((m) => m.ReportsModule),
        title: 'Reports | Dorrance',
        data: { animation: 'reportsPage' }
      },
      {
        path: 'contact-messages',
        loadChildren: () =>
          import('./pages/contact_messages/contact_messages.module').then((m) => m.ContactMessagesModule),
        title: 'Contact Messages | Dorrance',
        data: { animation: 'contactMessagesPage' }
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.module').then((m) => m.SettingsModule),
        title: 'Settings | Dorrance',
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
