import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CatalogComponent } from './catalog.component';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { SharedModule } from '../../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LucideAngularModule, MessageSquare } from "lucide-angular";
import { FilesComponent } from './files/files.component';
import { CategoriesComponent } from './categories/categories.component';
import { BooksComponent } from './books/books.component';
import { AddEditCategoryComponent } from './categories/add-edit/add-edit.component';
import { AddEditFileComponent } from './files/add-edit/add-edit.component';
import { PreviewModalComponent } from './files/preview/preview.component';
import { AddEditBookComponent } from './books/add-edit/add-edit.component';
import { AdvancedFiltersComponent } from './books/advanced-filters/advanced-filters.component';

@NgModule({
  declarations: [
    CatalogComponent,
    FilesComponent,
    CategoriesComponent,
    BooksComponent,
    AddEditCategoryComponent,
    AddEditFileComponent,
    PreviewModalComponent,
    AddEditBookComponent,
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
            component: CatalogComponent
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
export class CatalogModule { }
