import { ProjectDetailsComponent } from './pages/my-projects/project-details/project-details.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioPortalPageComponent } from './audioPortal.component';
import { MyBooksComponent } from './pages/my-books/my-books.component';
import { MyProjectsComponent } from './pages/my-projects/my-projects.component';
import { AudioPortalAuthGuard } from '../authAudioPortal/guards/auth.guard';
import { BookReaderComponent } from './pages/my-books/book-reader/book-reader.component';


const routes: Routes = [
  {
    path: '',
    component: AudioPortalPageComponent,
    children: [
      { path: '', redirectTo: 'my-books', pathMatch: 'full' },
      {
        path: 'my-books',
        title: 'My Books',
        component: MyBooksComponent,
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'myBooksPage', roles: ['Author', 'Customer'] }
      },
      {
        path: 'my-projects',
        title: 'My Projects',
        component: MyProjectsComponent,
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'myProjectsPage', roles: ['Author', 'Editor'] }
      },
      {
        path: 'my-projects/:id',
        title: 'Project Details',
        component: ProjectDetailsComponent,
        // resolve: {
        //   projectDetails: ProjectDetailsResolver
        // },
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'projectDetailsPage', roles: ['Author', 'Editor'] }
      },
      {
        path: 'my-books/:projectId/reader',
        title: 'Book Reader',
        component: BookReaderComponent,
        canActivate: [AudioPortalAuthGuard],
        data: { animation: 'bookReaderPage', roles: ['Author', 'Customer'] }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioPortalRoutingModule { }
