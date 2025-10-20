import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}/`;

@Injectable({
	providedIn: 'root'
})

// Portal - User APIs
export class ApiPublicService {
  private readonly base = `${environment.apiUrl}/`;

  public common = {
    list: this.base + 'common/voices', // GET
  }

}
