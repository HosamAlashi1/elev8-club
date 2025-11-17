import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashComponent } from './dash.component';
import { PermissionGuard } from '../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: DashComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        title: 'Dashboard | Elev8 Club',
        data: { animation: 'dashPage' },
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./pages/orders_Managment/orders.module').then((m) => m.OrdersModule),
        title: 'Orders | Elev8 Club',
        data: { animation: 'ordersPage', permission: 'VIEW_ORDERS' },
        canActivate: [PermissionGuard]
      },
      {
        path: 'testimonials',
        loadChildren: () =>
          import('./pages/testimonials/testimonials.module').then((m) => m.TestimonialsModule),
        title: 'Testimonials | Elev8 Club',
        data: { animation: 'testimonialsPage', permission: 'LOGS' }, // لو عندك بيرميشن مخصص للتستيمونيال بدله
        canActivate: [PermissionGuard]
      },
      {
        path: 'catalog',
        loadChildren: () =>
          import('./pages/catalog/catalog.module').then((m) => m.CatalogModule),
        title: 'Catalog | Elev8 Club',
        data: { animation: 'catalogPage', permission: ['VIEW_BOOKS', 'VIEW_CATEGORIES', 'VIEW_FILES'] },
        canActivate: [PermissionGuard]
      },
      {
        path: 'admins',
        loadChildren: () =>
          import('./pages/admins/admins.module').then((m) => m.AdminsModule),
        title: 'Admins | Elev8 Club',
        data: { animation: 'adminsPage', permission: 'VIEW_ADMINS' },
        canActivate: [PermissionGuard]
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./pages/users/users.module').then((m) => m.UsersModule),
        title: 'Users Management | Elev8 Club',
        data: {
          animation: 'usersPage',
          permission: ['VIEW_AUTHORS', 'VIEW_EDITORS', 'VIEW_CUSTOMERS'] 
        },
        canActivate: [PermissionGuard]
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./pages/reports/reports.module').then((m) => m.ReportsModule),
        title: 'Reports | Elev8 Club',
        data: { animation: 'reportsPage', permission: 'MANAGE_LOGS' },
        canActivate: [PermissionGuard]
      },
      {
        path: 'contact-messages',
        loadChildren: () =>
          import('./pages/contact_messages/contact_messages.module').then((m) => m.ContactMessagesModule),
        title: 'Contact Messages | Elev8 Club',
        data: { animation: 'contactMessagesPage', permission: 'LOGS' }, // عدلها لو عندك بيرميشن خاص
        canActivate: [PermissionGuard]
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.module').then((m) => m.SettingsModule),
        title: 'Settings | Elev8 Club',
        data: { animation: 'settingsPage', permission: 'MANAGE_ROLES' }, // أو ADMIN حسب اللوجيك
        canActivate: [PermissionGuard]
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
