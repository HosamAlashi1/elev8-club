import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}/`;

@Injectable({
  providedIn: 'root'
})
// Landing Page  APIs
export class ApiLandingService {
  private readonly base = `${environment.apiUrl}/website/`;

  public home = {
    content: this.base + 'home',
    subscribe: this.base + 'subscribe', // POST
    contact: this.base + 'contact' // POST
  };

  public contact = {
    send: this.base + 'contact/send', // POST
  };

  public books = {
    list: this.base + 'shop', // its a list of books for shop , GET
    details: (id: number) => this.base + `book-details/${id}`,
  };

  public featured_author = {
    list: this.base + 'featured_authors', // its a list of featured author , GET
  };

  public common = {
    categories: API_BASE_URL + 'Common/categories', // GET
  };
}