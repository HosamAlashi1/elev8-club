import { AuthGuard } from './../auth/guards/auth.guard';
// landingPage-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingPageComponent } from './landingPage.component';

import { HomeComponent } from './pages/home/home.component';
import { VideoQuestionsComponent } from './pages/video-questions/video-questions.component';
import { ClosedComponent } from './pages/closed/closed.component';
import { campaignClosedGuard, campaignOpenGuard } from './guards/campaign-open.guard';


const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent, // الـ layout الرئيسي
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: HomeComponent,
        canActivate: [campaignOpenGuard],
        data: { animation: 'HomePage' }
      },
      {
        path: 'video-questions',
        component: VideoQuestionsComponent,
        data: { animation: 'VideoQuestionsPage' }
      },
      {
        path: 'closed',
        component: ClosedComponent,
        canActivate: [campaignClosedGuard],
        data: { animation: 'ClosedPage' }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandingPageRoutingModule { }
