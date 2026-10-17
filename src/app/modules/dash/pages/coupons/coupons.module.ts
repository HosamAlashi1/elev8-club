import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CouponsRoutingModule } from './coupons-routing.module';
import { CouponsComponent } from './coupons.component';
import { CreateCouponsComponent } from './create-coupons/create-coupons.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [CouponsComponent, CreateCouponsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CouponsRoutingModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    SharedModule
  ]
})
export class CouponsModule { }
