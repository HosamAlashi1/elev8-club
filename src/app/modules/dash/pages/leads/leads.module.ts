import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LucideAngularModule, Search, Eye, Filter, Download } from 'lucide-angular';

import { LeadsRoutingModule } from './leads-routing.module';
import { LeadsComponent } from './leads.component';
import { SharedModule } from '../../shared/shared.module';
import { ViewLeadComponent } from './view-lead/view-lead.component';


@NgModule({
  declarations: [
    LeadsComponent,
    ViewLeadComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LeadsRoutingModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    SharedModule,
    LucideAngularModule.pick({ Search, Eye, Filter, Download })
  ]
})
export class LeadsModule { }
