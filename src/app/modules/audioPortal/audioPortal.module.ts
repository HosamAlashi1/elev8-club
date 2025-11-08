import { NoteItemComponent } from './pages/my-projects/project-details/chapter-workspace/tabs/notes-tab/note-item/note-item.component';
import { NotesTabComponent } from './pages/my-projects/project-details/chapter-workspace/tabs/notes-tab/notes-tab.component';
import { ParagraphItemComponent } from './pages/my-projects/project-details/chapter-workspace/tabs/paragraphs-tab/paragraph-item/paragraph-item.component';
import { ParagraphsTabComponent } from './pages/my-projects/project-details/chapter-workspace/tabs/paragraphs-tab/paragraphs-tab.component';
import { ChapterWorkspaceComponent } from './pages/my-projects/project-details/chapter-workspace/chapter-workspace.component';
import { ChaptersSidebarComponent } from './pages/my-projects/project-details/chapters-sidebar/chapters-sidebar.component';
import { ProjectDetailsComponent } from './pages/my-projects/project-details/project-details.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LottieModule } from 'ngx-lottie';
import { DragDropModule } from '@angular/cdk/drag-drop';
import player from 'lottie-web';
import { AudioPortalRoutingModule } from './audioPortal-routing.module';
import { SharedModule } from '../dash/shared/shared.module';
import { LandingSharedModule } from './shared/landing-shared.module';
import { AudioPortalPageComponent } from './audioPortal.component';
import { MyBooksComponent } from './pages/my-books/my-books.component';
import { HeaderComponent } from './layout/header/header.component';
import { AudioSetupModalComponent } from './components/audio-setup-modal/audio-setup-modal.component';
import { MyProjectsComponent } from './pages/my-projects/my-projects.component';
import { AddProjectModalComponent } from './pages/my-projects/add-project-modal/add-project-modal.component';
import { AudioDockComponent } from './shared/audio-dock/audio-dock.component';
import { VoiceSelectionModalComponent } from './components/voice-selection-modal/voice-selection-modal.component';
import { BookReaderComponent } from './pages/my-books/book-reader/book-reader.component';
import { BookFlipComponent } from './pages/my-books/book-reader/components/book-flip/book-flip.component';
import { PublicSharedModule } from '../shared/public-shared.module';


export function playerFactory() {
  return player;
}


@NgModule({
  declarations: [
    HeaderComponent,
    MyBooksComponent,
    AudioPortalPageComponent,
    AudioSetupModalComponent,
    VoiceSelectionModalComponent,
    MyProjectsComponent,
    AddProjectModalComponent,
    ProjectDetailsComponent,
    ChaptersSidebarComponent,
    ChapterWorkspaceComponent,
    ParagraphsTabComponent,
    ParagraphItemComponent,
    NotesTabComponent,
    NoteItemComponent,
    AudioDockComponent,
    BookReaderComponent,
    BookFlipComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    InlineSVGModule,
    NgxSkeletonLoaderModule,
    SharedModule,
    NgbDropdownModule,
    DragDropModule,
    AudioPortalRoutingModule,
    LottieModule.forRoot({ player: playerFactory }),
    LandingSharedModule,
    PublicSharedModule
  ],
  providers: [
    // ConfirmationDialogService
  ]
})
export class AudioPortalModule { }
