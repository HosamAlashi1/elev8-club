import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContactMessagesComponent } from './contact_messages.component';

const routes: Routes = [
  {
    path: '',
    component: ContactMessagesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubscribersRoutingModule {}
