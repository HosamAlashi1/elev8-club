import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiAdminService } from 'src/app/modules/services/api.admin.service';

@Component({
    selector: 'app-advanced-filters',
    templateUrl: './advanced-filters.component.html',
    styleUrls: ['./advanced-filters.component.css']
})
export class AdvancedFiltersComponent implements OnInit {

    // Filters data
    author_id: number | null = null;
    category_id: number | null = null;
    lowestPrice: number | null = null;
    highestPrice: number | null = null;

    // Authors data for searchable-select
    authors: any[] = [];
    authorsLoading = false;
    initialAuthorsLoaded = false;

    // Categories data for modern-select
    categories: any[] = [];
    categoriesOptions: { value: any; label: string }[] = [];

    constructor(
        public activeModal: NgbActiveModal,
        private http: HttpService,
        private api: ApiAdminService
    ) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    // Load categories for dropdown
    loadCategories(): void {
        const url = this.api.common.categories;
        this.http.listGet(url, 'common-categories').subscribe({
            next: (res: any) => {
                if (res?.success && res?.data) {
                    this.categories = res.data || [];
                    this.categoriesOptions = this.categories.map(cat => ({
                        value: cat.id,
                        label: cat.name
                    }));
                }
            },
            error: () => {
                this.categories = [];
                this.categoriesOptions = [];
            }
        });
    }

    // Load authors for searchable-select
    loadAuthors(searchQuery: string): void {
        this.authorsLoading = true;
        const url = `${this.api.common.authors}?q=${encodeURIComponent(searchQuery)}`;
        
        this.http.listGet(url, 'common-authors').subscribe({
            next: (res: any) => {
                if (res?.success && res?.data) {
                    this.authors = res.data || [];
                } else {
                    this.authors = [];
                }
                this.authorsLoading = false;
            },
            error: () => {
                this.authors = [];
                this.authorsLoading = false;
            }
        });
    }

    // Handle initial authors loading when dropdown opens
    loadInitialAuthors(): void {
        if (!this.initialAuthorsLoaded) {
            this.loadAuthors('');
            this.initialAuthorsLoaded = true;
        }
    }

    // Handle author search
    onAuthorSearch(searchQuery: string): void {
        this.loadAuthors(searchQuery);
    }

    // Update category FormControl value
    updateCategoryValue(value: any): void {
        this.category_id = value;
    }

    // Apply filters and close modal
    applyFilters(): void {
        const filters = {
            author_id: this.author_id,
            category_id: this.category_id,
            lowestPrice: this.lowestPrice,
            highestPrice: this.highestPrice
        };

        this.activeModal.close(filters);
    }

    // Close modal without applying
    close(): void {
        this.activeModal.dismiss();
    }

    // Clear all filters
    clearAll(): void {
        this.author_id = null;
        this.category_id = null;
        this.lowestPrice = null;
        this.highestPrice = null;
    }
}
