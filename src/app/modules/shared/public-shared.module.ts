import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModalModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { NotificationsDrawerComponent } from './notifications/notifications-drawer/notifications-drawer.component';
import { LogoutConfirmationModalComponent } from './logout-confirmation-modal/logout-confirmation-modal.component';
import { CountdownPipe } from '../pipe/countdown.pipe';
import { DurationFormatPipe } from '../pipe/duration-format.pipe';
import { TimeAgoPipe } from '../pipe/time-ago.pipe';
import { UtcToLocalPipe } from '../pipe/uts-to-local.pipe';
import { SharedModule } from "../dash/shared/shared.module";
@NgModule({
  declarations: [
    NotificationsDrawerComponent,
    LogoutConfirmationModalComponent,
    UtcToLocalPipe,
    TimeAgoPipe,
    DurationFormatPipe,
    CountdownPipe
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    SharedModule
],
  exports: [
    NotificationsDrawerComponent,
    LogoutConfirmationModalComponent,
    UtcToLocalPipe,
    TimeAgoPipe,
    DurationFormatPipe,
    CountdownPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PublicSharedModule { }
