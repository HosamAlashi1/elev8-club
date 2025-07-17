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
import { ProfileComponent } from './profile/profile.component';
import { RolesAndPermissionsComponent } from './roles-and-permissions/roles-and-permissions.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { AddEditComponent } from './roles-and-permissions/add-edit/add-edit.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [
    SettingsComponent,
    ProfileComponent,
    RolesAndPermissionsComponent,
    ChangePasswordComponent,
    AddEditComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    RouterModule.forChild([
      {
        path: 'profile',
        component: ProfileComponent,
        data: { animation: 'profilePage' }
      },
      {
        path: 'roles',
        component: RolesAndPermissionsComponent,
        data: { animation: 'rolesPage' }
      },
      { path: '', component: SettingsComponent },
      { path: '**', redirectTo: '' },
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
export class SettingsModule { }
