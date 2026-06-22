import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyLeadsComponent } from './my-leads.component';

const routes: Routes = [
  { path: '', component: MyLeadsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyLeadsRoutingModule {}
