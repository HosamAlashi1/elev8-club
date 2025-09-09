import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FileManagementComponent } from '../dash/shared/file-management/file-management.component';
import { UserProfileComponent } from '../dash/shared/user-profile/user-profile.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
    providedIn: 'root'
})
export class PublicService {

    public numOfRows: number;
    public onlineStatus: Subject<boolean> = new Subject<boolean>();

    constructor(private modalService: NgbModal) {
        this.onlineStatus.next(navigator.onLine);
        window.addEventListener('online', () => {
            this.onlineStatus.next(true);
        }); 

        window.addEventListener('offline', () => {
            this.onlineStatus.next(false);
        });
    }

    public getUserData() {
        const data = localStorage.getItem('Dorrance-data');
        return data ? JSON.parse(data).user : null;
    }

    public getNumOfRows(innerHeight: number, rowHeight: number): number {
        this.numOfRows = Math.max(1, Math.floor((window.innerHeight - innerHeight) / rowHeight));
        return this.numOfRows;
    }

    openImage(title: string, path: string) {
        const modalRef = this.modalService.open(FileManagementComponent, { fullscreen: true, windowClass: 'modal-image' });
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.path = path;
    }

    openProfile(userId: any) {
        const modalRef = this.modalService.open(UserProfileComponent, { centered: true });
        modalRef.componentInstance.userId = userId;
    }

}