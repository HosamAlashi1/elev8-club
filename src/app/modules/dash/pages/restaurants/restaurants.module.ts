import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RestaurantsComponent } from './restaurants.component';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { SharedModule } from '../../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AddEditComponent } from './add-edit/add-edit.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { ViewMapComponent } from './view-map/view-map.component';
import { LucideAngularModule , ChefHat } from "lucide-angular";


@NgModule({
  declarations: [
    RestaurantsComponent,
    AddEditComponent,
    ViewMapComponent
  ],
  imports: [
    CommonModule,
    GoogleMapsModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    RouterModule.forChild([
        {
            path: '',
            component: RestaurantsComponent
        },
        {
            path: 'add',
            component: AddEditComponent
        },
        {
            path: 'edit/:id',
            component: AddEditComponent
        },
        {
            path: ':restaurantId/meals',
            loadChildren: () => import('./meals/meals.module').then((m) => m.MealsModule),
            title: 'Meals Restaurants | Turbo Eat',
        }
    ]),
    NgxPaginationModule,
    NgxSkeletonLoaderModule,
    NgbModule,
    NgbDropdownModule,
    MdbDropdownModule,
    MdbRippleModule,
    SharedModule,
    LucideAngularModule.pick({
      ChefHat
    })
]
})
export class RestaurantsModule { }
