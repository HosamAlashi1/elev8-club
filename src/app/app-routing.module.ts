import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './modules/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
    data: { animation: 'auth' }
  },
  {
    path: 'error',
    loadChildren: () => import('./modules/error/error.module').then((m) => m.ErrorModule),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/dash/dash.module').then((m) => m.DashModule),
    data: { animation: 'dash' }
  },
  { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
