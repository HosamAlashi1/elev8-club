import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashComponent } from './dash.component';

const routes: Routes = [
  {
    path: '',
    component: DashComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        title: 'Dashboard | Turbo Eat',
        data: { animation: 'dashPage' }
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./pages/orders/orders.module').then((m) => m.OrdersModule),
        title: 'Orders | Turbo Eat',
        data: { animation: 'ordersPage' }
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./pages/notifications/notifications.module').then((m) => m.NotificationsModule),
        title: 'Notifications | Turbo Eat',
        data: { animation: 'notificationsPage' }
      },
      {
        path: 'statistics',
        loadChildren: () =>
          import('./pages/statistics-and-reports/statistics-and-reports.module').then((m) => m.StatisticsAndReportsModule),
        title: 'Statistics & Reports | Turbo Eat',
        data: { animation: 'statisticsPage' }
      },
      {
        path: 'admins',
        loadChildren: () =>
          import('./pages/admins/admins.module').then((m) => m.AdminsModule),
        title: 'Admins | Turbo Eat',
        data: { animation: 'adminsPage' }
      },
       {
        path: 'users',
        loadChildren: () =>
          import('./pages/users/users.module').then((m) => m.UsersModule),
        title: 'Users | Turbo Eat',
        data: { animation: 'usersPage' }
      },
      {
        path: 'restaurants',
        loadChildren: () =>
          import('./pages/restaurants/restaurants.module').then((m) => m.RestaurantsModule),
        title: 'Restaurants | Turbo Eat',
        data: { animation: 'restaurantsPage' }
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./pages/categories/categories.module').then((m) => m.CategoriesModule),
        title: 'Categories | Turbo Eat',
        data: { animation: 'categoriesPage' }
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.module').then((m) => m.SettingsModule),
        title: 'Settings | Turbo Eat',
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashRoutingModule { }
