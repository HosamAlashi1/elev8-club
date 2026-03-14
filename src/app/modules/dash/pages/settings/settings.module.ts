import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { SettingsComponent } from './settings.component';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { SharedModule } from '../../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SalesSettingsComponent } from './sales-settings/sales-settings.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { AddEditSalesItemComponent } from './sales-settings/add-edit-sales-item/add-edit-sales-item.component';
import { EmailCampaignComponent } from './email-campaign/email-campaign.component';

@NgModule({
  declarations: [
    SettingsComponent,
    SalesSettingsComponent,
    GeneralSettingsComponent,
    AddEditSalesItemComponent,
    EmailCampaignComponent
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
    QuillModule.forRoot()
  ]
})
export class SettingsModule { }
