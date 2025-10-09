import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { SharedModule } from '../../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LucideAngularModule, MessageSquare } from "lucide-angular";

// Main Users Component
import { UsersComponent } from './users.component';

// Sub Components
import { CustomersComponent } from './customers/customers.component';
import { AuthorsComponent } from './authors/authors.component';
import { EditorsComponent } from './editors/editors.component';
import { AddEditCustomerComponent } from './customers/add-edit/add-edit.component';
import { AddEditAuthorComponent } from './authors/add-edit/add-edit.component';
import { AddEditEditorComponent } from './editors/add-edit/add-edit.component';
import { AdvancedFiltersComponent } from './customers/advanced-filters/advanced-filters.component';

@NgModule({
  declarations: [
    UsersComponent,
    CustomersComponent,
    AuthorsComponent,
    EditorsComponent,
    AddEditCustomerComponent,
    AddEditAuthorComponent,
    AddEditEditorComponent,
    AdvancedFiltersComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgApexchartsModule,
    RouterModule.forChild([
        {
            path: '',
            component: UsersComponent
        }
    ]),
    NgxPaginationModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    NgbDropdownModule,
    MdbDropdownModule,
    MdbRippleModule,
    SharedModule,
    LucideAngularModule.pick({ MessageSquare })
  ]
})
export class UsersModule { }
