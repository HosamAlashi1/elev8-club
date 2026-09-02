import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ArrowLeft,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Inbox,
  LucideAngularModule,
  MessageCircle,
  Search,
  Send,
  UserRound
} from 'lucide-angular';
import { SupportInboxComponent } from './support-inbox.component';

@NgModule({
  declarations: [SupportInboxComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: SupportInboxComponent }
    ]),
    LucideAngularModule.pick({
      ArrowLeft,
      CheckCheck,
      CheckCircle2,
      Clock3,
      Inbox,
      MessageCircle,
      Search,
      Send,
      UserRound
    })
  ]
})
export class SupportInboxModule { }
