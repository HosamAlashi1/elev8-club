import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LucideAngularModule, Copy, Eye, Edit, Trash2, Plus } from 'lucide-angular';

import { AffiliatesRoutingModule } from './affiliates-routing.module';
import { AffiliatesComponent } from './affiliates.component';
import { SharedModule } from '../../shared/shared.module';
import { AddEditAffiliateComponent } from './add-edit-affiliate/add-edit-affiliate.component';
import { ViewAffiliateComponent } from './view-affiliate/view-affiliate.component';


@NgModule({
  declarations: [
    AffiliatesComponent,
    AddEditAffiliateComponent,
    ViewAffiliateComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AffiliatesRoutingModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    SharedModule,
    LucideAngularModule.pick({ Copy, Eye, Edit, Trash2, Plus })
  ]
})
export class AffiliatesModule { }
