import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class HttpService {

    private loadingMap = new Map<string, BehaviorSubject<boolean>>();
    constructor(private http: HttpClient) { }

    getLoading(field?: string): Observable<boolean> {
        if (!field) {
            return new BehaviorSubject<boolean>(false).asObservable();
        }
        if (!this.loadingMap.has(field)) {
            this.loadingMap.set(field, new BehaviorSubject<boolean>(false));
        }
        return this.loadingMap.get(field)!.asObservable();
    }

    setLoading(field?: string, isLoading: boolean = false): void {
        if (!field) {
            return;
        }
        if (!this.loadingMap.has(field)) {
            this.loadingMap.set(field, new BehaviorSubject<boolean>(false));
        }
        this.loadingMap.get(field)!.next(isLoading);
    }

    list(url: string, data: any, field?: string): Observable<any> {
        if (field) {
            this.setLoading(field, true);
        }
        return this.http.post(url, data).pipe(
            tap({
                next: (res: any) => res,
                error: (err: any) => err,
                finalize: () => field && this.setLoading(field, false)
            })
        );
    }

    listGet(url: string, field?: string): Observable<any> {
        if (field) {
            this.setLoading(field, true);
        }
        return this.http.get(url).pipe(
            tap({
                next: (res: any) => res,
                error: (err: any) => err,
                finalize: () => field && this.setLoading(field, false)
            })
        );
    }

    action(url: string, data: any, field?: string): Observable<any> {
        if (field) {
            this.setLoading(field, true);
        }
        return this.http.post(url, data).pipe(
            tap({
                next: (res: any) => res,
                error: (err: any) => err,
                finalize: () => field && this.setLoading(field, false)
            })
        );
    }
}
