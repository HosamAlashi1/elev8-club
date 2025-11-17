import { NgModule ,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModalModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
register();

@NgModule({
    declarations: [
     
    ],
    imports: [
     CommonModule,
           RouterModule,
           ReactiveFormsModule, 
           FormsModule,
           NgbModule,
    ],
    exports: [
       
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LandingSharedModule { }
