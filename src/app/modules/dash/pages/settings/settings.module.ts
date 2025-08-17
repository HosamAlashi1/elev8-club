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
import { LucideAngularModule, Settings, Home, Lightbulb, Workflow, Layers, MonitorSmartphone, MessageSquare, PlayCircle, Phone, Layout, Folder } from 'lucide-angular';

@NgModule({
  declarations: [
    SettingsComponent,
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
    LucideAngularModule.pick({ 
      Settings, 
      Home, 
      Lightbulb, 
      Workflow, 
      Layers, 
      MonitorSmartphone, 
      MessageSquare, 
      PlayCircle, 
      Phone, 
      Layout, 
      Folder 
    })
  ]
})
export class SettingsModule { }
