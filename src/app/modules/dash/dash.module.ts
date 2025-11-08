import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DashRoutingModule } from './dash-routing.module';
import { DashComponent } from './dash.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SidebarComponent } from './components/side-bar/side-bar.component';
import { ConfirmationDialogService } from './components/confirmation-dialog/confirmation-dialog.service';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgxPaginationModule } from 'ngx-pagination';
import { LottieModule } from 'ngx-lottie';
import { LottieOverlayComponent } from './shared/lottie-overlay/lottie-overlay.component';
import {
  LucideAngularModule,
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  UserCog
} from 'lucide-angular';
import { HeaderComponent } from './components/header/header.component';
import { PublicSharedModule } from '../shared/public-shared.module';


@NgModule({
  declarations: [
    DashComponent,
    SidebarComponent,
    ConfirmationDialogComponent,
    LottieOverlayComponent,
    HeaderComponent,
    
  ],
  imports: [
    CommonModule,
    DashRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    InlineSVGModule,
    NgxPaginationModule,
    NgxSkeletonLoaderModule,
    LottieModule,
    PublicSharedModule,
    LucideAngularModule.pick({
      Home,
      Package,
      ShoppingCart,
      Users,
      BarChart2,
      Settings,
      UserCog
    })
  ],
  providers: [
    ConfirmationDialogService
  ]
})
export class DashModule { }
