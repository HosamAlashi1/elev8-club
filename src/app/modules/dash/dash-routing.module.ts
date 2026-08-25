import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashComponent } from './dash.component';
import { RoleGuard } from '../auth/guards/role.guard';

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
        path: 'admins',
        canActivate: [RoleGuard],
        data: { animation: 'adminsPage', roles: ['admin'] },
        loadChildren: () =>
          import('./pages/admins/admins.module').then((m) => m.AdminsModule),
        title: 'Admins | Elev8 Club',
      },
      {
        path: 'settings',
        canActivate: [RoleGuard],
        data: { animation: 'settingsPage', roles: ['admin'] },
        loadChildren: () =>
          import('./pages/settings/settings.module').then((m) => m.SettingsModule),
        title: 'Settings | Elev8 Club',
      },
      {
        path: 'affiliates',
        canActivate: [RoleGuard],
        data: { animation: 'affiliatesPage', roles: ['admin'] },
        loadChildren: () =>
          import('./pages/affiliates/affiliates.module').then((m) => m.AffiliatesModule),
        title: 'Affiliates | Elev8 Club',
      },
      {
        path: 'leads',
        canActivate: [RoleGuard],
        data: { animation: 'leadsPage', roles: ['admin', 'sales'] },
        loadChildren: () =>
          import('./pages/leads/leads.module').then((m) => m.LeadsModule),
        title: 'Leads | Elev8 Club',
      },
      {
        path: 'my-leads',
        canActivate: [RoleGuard],
        data: { animation: 'myLeadsPage', roles: ['admin', 'account_manager', 'affiliate'] },
        loadChildren: () =>
          import('./pages/my-leads/my-leads.module').then((m) => m.MyLeadsModule),
        title: 'My Leads | Elev8 Club',
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
