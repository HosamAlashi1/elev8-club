import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import { SalesPerformanceRoutingModule } from './sales-performance-routing.module';
import { SalesPerformanceComponent } from './sales-performance.component';
import { SalesMemberDetailComponent } from './sales-member-detail/sales-member-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    SalesPerformanceComponent,
    SalesMemberDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgApexchartsModule,
    SalesPerformanceRoutingModule,
    SharedModule
  ]
})
export class SalesPerformanceModule { }
