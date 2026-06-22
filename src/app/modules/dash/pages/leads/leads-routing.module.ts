import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeadsComponent } from './leads.component';
import { LeadDetailComponent } from './lead-detail/lead-detail.component';

const routes: Routes = [
  { path: '', component: LeadsComponent },
  { path: ':key', component: LeadDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeadsRoutingModule { }
