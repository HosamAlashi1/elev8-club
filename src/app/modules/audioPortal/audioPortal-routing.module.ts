import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioPortalPageComponent } from './audioPortal.component';
import { MyBooksComponent } from './pages/my-books/my-books.component';
import { MyProjectsComponent } from './pages/my-projects/my-projects.component';
import { ProjectDetailsComponent } from './pages/project-details/project-details.component';
import { ProjectDetailsResolver } from './pages/project-details/resolvers/project-details.resolver';
import { AudioPortalAuthGuard } from '../authAudioPortal/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AudioPortalPageComponent,
    children: [
      { path: '', redirectTo: 'my-books', pathMatch: 'full' },
      {
        path: 'my-books',
        component: MyBooksComponent,
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'myBooksPage' }
      },
      {
        path: 'my-projects',
        component: MyProjectsComponent,
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'myProjectsPage', roles: ['Author' , 'Editor'] }
      },
      {
        path: 'my-projects/:id',
        component: ProjectDetailsComponent,
        resolve: {
          projectDetails: ProjectDetailsResolver
        },
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'projectDetailsPage', roles: ['Author' , 'Editor'] }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioPortalRoutingModule { }
