import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LucideAngularModule , Mail } from 'lucide-angular';

import { SubscribersRoutingModule } from './contact_messages-routing.module';
import { ContactMessagesComponent } from './contact_messages.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ContactMessagesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxSkeletonLoaderModule,
    LucideAngularModule.pick({ Mail }),
    SubscribersRoutingModule,
    SharedModule
  ]
})
export class ContactMessagesModule { }
