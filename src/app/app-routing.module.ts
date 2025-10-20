import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { AudioPortalAuthGuard } from './modules/authAudioPortal/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
    data: { animation: 'auth' }
  },
  {
    path: 'auth-audio-portal',
    loadChildren: () => import('./modules/authAudioPortal/auth.module').then((m) => m.AuthModule),
    data: { animation: 'authAudio' }
  },
  {
    path: '',
    loadChildren: () => import('./modules/landingPage/landingPage.module').then((m) => m.LandingPageModule),
    data: { animation: 'landing' }
  },
  {
    path: 'error',
    loadChildren: () => import('./modules/error/error.module').then((m) => m.ErrorModule),
    data: { animation: 'error' }
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/dash/dash.module').then((m) => m.DashModule),
    data: { animation: 'dashboard' }
  },

  {
    path: 'audio-portal',
    canActivate: [AudioPortalAuthGuard],
    loadChildren: () => import('./modules/audioPortal/audioPortal.module').then((m) => m.AudioPortalModule),
    data: { animation: 'dashboard' }
  },

  { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
