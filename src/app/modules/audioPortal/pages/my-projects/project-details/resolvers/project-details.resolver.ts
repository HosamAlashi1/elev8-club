import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { ProjectDetails, ProjectDetailsResponse } from '../models/project-details.model';

/**
 * Resolver to pre-fetch project details before activating the route
 * Only loads project name + chapters list (lightweight)
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectDetailsResolver  {

  // constructor(
  //   private httpService: HttpService,
  //   private apiPortal: ApiPortalService,
  //   private router: Router
  // ) {}

  // resolve(
  //   route: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot
  // ): Observable<ProjectDetails | null> {
  //   const projectId = route.paramMap.get('id');
    
  //   if (!projectId) {
  //     this.router.navigate(['/audio-portal/my-projects']);
  //     return EMPTY;
  //   }

  //   const url = this.apiPortal.projects.details(projectId);

  //   return this.httpService.listGet(url, 'projectResolver').pipe(
  //     map((response: ProjectDetailsResponse) => {
  //       if (response.success && response.data) {
  //         return response.data;
  //       }
  //       return null;
  //     }),
  //     catchError(error => {
  //       console.error('Failed to load project:', error);
  //       // Don't navigate away, let component handle error state
  //       return of(null);
  //     })
  //   );
  // }
}
