import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AffiliatesComponent } from './affiliates.component';

const routes: Routes = [{ path: '', component: AffiliatesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AffiliatesRoutingModule { }
