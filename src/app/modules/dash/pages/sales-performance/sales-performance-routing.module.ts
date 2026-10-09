import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesPerformanceComponent } from './sales-performance.component';
import { SalesMemberDetailComponent } from './sales-member-detail/sales-member-detail.component';

const routes: Routes = [
  { path: '', component: SalesPerformanceComponent },
  { path: ':memberKey', component: SalesMemberDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesPerformanceRoutingModule { }
