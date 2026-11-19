import { NgModule ,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextLengthPipe } from '../../pipe/text-length.pipe';
import { PaginationComponent } from './pagination/pagination.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { NoResultsComponent } from './no-results/no-results.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileManagementComponent } from './file-management/file-management.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { DeleteComponent } from './delete/delete.component';
import { MultiSelectComponent } from './multi-select/multi-select.component';
import { SearchableSelectComponent } from './searchable-select/searchable-select.component';
import { ModernSelectComponent } from './modern-select/modern-select.component';
import { CopyPhoneComponent } from './copy-phone/copy-phone.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LucideAngularModule, Home, ShieldCheck, Building2, Layers, Package, Folder, Users, MessageSquare, Mail, Inbox, Settings, MonitorSmartphone, Workflow, ListChecks, BookOpen, UserCheck, CreditCard, ShoppingCart, User, MapPin, Box, AlertCircle, X, List } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { LeadDateFilterComponent } from './lead-date-filter/lead-date-filter.component';



@NgModule({
    declarations: [
        TextLengthPipe,
        PaginationComponent,
        NoResultsComponent,
        DeleteComponent,
        FileManagementComponent,
        UserProfileComponent,
        MultiSelectComponent,
        SearchableSelectComponent,
        ModernSelectComponent,
        CopyPhoneComponent,
    ],
    imports: [
        CommonModule,
        RouterModule,
        NgxPaginationModule,
        ReactiveFormsModule,
        FormsModule,
        LeadDateFilterComponent,
        NgbModule,
        NgxSkeletonLoaderModule,
        LucideAngularModule.pick({
            Home,
            ShieldCheck,
            Building2,
            Layers,
            Package,
            Folder,
            Users,
            MessageSquare,
            Mail,
            Inbox,
            Settings,
            MonitorSmartphone,
            Workflow,
            ListChecks,
            BookOpen,
            UserCheck,
            CreditCard,
            ShoppingCart,
            User,
            MapPin,
            Box,
            AlertCircle,
            X,
            List
        })
    ],
    exports: [
        TextLengthPipe,
        PaginationComponent,
        NoResultsComponent,
        MultiSelectComponent,
        SearchableSelectComponent,
        ModernSelectComponent,
        CopyPhoneComponent,
        LeadDateFilterComponent,
        ReactiveFormsModule,
        FormsModule,
        NgbModule,
        NgxPaginationModule,
        NgxSkeletonLoaderModule,
        LucideAngularModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
