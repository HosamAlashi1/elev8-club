import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DropdownService {
    private activeDropdownId = new BehaviorSubject<string | null>(null);

    setActiveDropdown(id: string | null) {
        this.activeDropdownId.next(id);
    }

    getActiveDropdown() {
        return this.activeDropdownId.asObservable();
    }
}
