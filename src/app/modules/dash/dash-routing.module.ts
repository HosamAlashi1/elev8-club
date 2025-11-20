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
        title: 'Dashboard | Elev8 Club',
        data: { animation: 'dashPage' },
      },
      {
        path: 'admins',
        loadChildren: () =>
          import('./pages/admins/admins.module').then((m) => m.AdminsModule),
        title: 'Admins | Elev8 Club',
        data: { animation: 'adminsPage'},
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.module').then((m) => m.SettingsModule),
        title: 'Settings | Elev8 Club',
        data: { animation: 'settingsPage' }, // أو ADMIN حسب اللوجيك
      },
      {
        path: 'affiliates',
        loadChildren: () =>
          import('./pages/affiliates/affiliates.module').then((m) => m.AffiliatesModule),
        title: 'Affiliates | Elev8 Club',
        data: { animation: 'affiliatesPage' },
      },
      {
        path: 'leads',
        loadChildren: () =>
          import('./pages/leads/leads.module').then((m) => m.LeadsModule),
        title: 'Leads | Elev8 Club',
        data: { animation: 'leadsPage' },
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
