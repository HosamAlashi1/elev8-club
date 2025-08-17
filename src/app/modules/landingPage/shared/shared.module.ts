import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextLengthPipe } from '../pipe/text-length.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileManagementComponent } from './file-management/file-management.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LottieModule } from 'ngx-lottie';

@NgModule({
    declarations: [
        TextLengthPipe,
        FileManagementComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgbModule,
        LottieModule,
    ],
    exports: [
        TextLengthPipe,
    ]
})
export class SharedModule { }
