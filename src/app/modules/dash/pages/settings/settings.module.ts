import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsComponent } from './settings.component';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { SharedModule } from '../../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StoreInfoComponent } from './store-info/store-info.component';
import { PaymentsComponent } from './payments/payments.component';
import { ShippingComponent } from './shipping/shipping.component';
import { TaxesComponent } from './taxes/taxes.component';
import { ConstantsComponent } from './constants/constants.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { AddEditRoleComponent } from './roles-permissions/add-edit/add-edit.component';

@NgModule({
  declarations: [
    SettingsComponent,
    StoreInfoComponent,
    PaymentsComponent,
    ShippingComponent,
    TaxesComponent,
    ConstantsComponent,
    RolesPermissionsComponent,
    AddEditRoleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    RouterModule.forChild([
      { path: '', component: SettingsComponent }
    ]),
    NgxPaginationModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    NgbDropdownModule,
    MdbDropdownModule,
    MdbRippleModule,
    SharedModule,
  ]
})
export class SettingsModule { }
