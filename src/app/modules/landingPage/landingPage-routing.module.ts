import { AuthGuard } from './../auth/guards/auth.guard';
// landingPage-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingPageComponent } from './landingPage.component';

import { HomeComponent } from './pages/home/home.component';
import { VideoQuestionsComponent } from './pages/video-questions/video-questions.component';


const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent, // الـ layout الرئيسي
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: HomeComponent,
        data: { animation: 'HomePage' }
      },
      {
        path: 'video-questions',
        component: VideoQuestionsComponent,
        data: { animation: 'VideoQuestionsPage' }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandingPageRoutingModule { }
