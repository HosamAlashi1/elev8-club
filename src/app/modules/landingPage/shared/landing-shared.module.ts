import { NgModule ,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModalModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LandingAccountModalComponent } from './account/landing-account-modal/landing-account-modal.component';
import { SliderComponent } from './slider/slider.component';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
register();

@NgModule({
    declarations: [
        LandingAccountModalComponent,
        SliderComponent
    ],
    imports: [
     CommonModule,
           RouterModule,
           ReactiveFormsModule,
           FormsModule,
           NgbModule,
    ],
    exports: [
        LandingAccountModalComponent,
        SliderComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LandingSharedModule { }
