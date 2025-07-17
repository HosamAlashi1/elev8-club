import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StatisticsAndReportsComponent } from './statistics-and-reports.component';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { SharedModule } from '../../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { RevenueChartComponent } from './revenue-chart/revenue-chart.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { OrdersChartComponent } from './orders-chart/orders-chart.component';


@NgModule({
  declarations: [
    StatisticsAndReportsComponent,
    RevenueChartComponent,
    BarChartComponent,
    OrdersChartComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
     NgApexchartsModule,
    RouterModule.forChild([
      {
        path: '',
        component: StatisticsAndReportsComponent
      }
    ]),
    NgxPaginationModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    NgbDropdownModule,
    MdbDropdownModule,
    MdbRippleModule,
    SharedModule
  ]
})
export class StatisticsAndReportsModule { }
