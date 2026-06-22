import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

import { MyLeadsRoutingModule } from './my-leads-routing.module';
import { MyLeadsComponent } from './my-leads.component';
import { ViewAffiliateLeadComponent } from './view-affiliate-lead/view-affiliate-lead.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    MyLeadsComponent,
    ViewAffiliateLeadComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MyLeadsRoutingModule,
    NgbModule,
    NgxSkeletonLoaderModule,
    SharedModule
  ]
})
export class MyLeadsModule {}
