import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}/`;

@Injectable({
	providedIn: 'root'
})

// Portal - User APIs
export class ApiPortalService {
  private readonly base = `${environment.apiUrl}/portal/`;

  public account = {
    profile: this.base + 'account/profile', // GET
    update: this.base + 'account/update',   // POST
  };

  public orders = {
    list: this.base + 'orders',             // GET
    details: (id: number) => this.base + `orders/${id}`,
    create: this.base + 'orders/create',    // POST
    cancel: (id: number) => this.base + `orders/cancel/${id}`,
  };

  public cart = {
    items: this.base + 'cart/items',        // GET
    add: this.base + 'cart/add',            // POST
    remove: (id: number) => this.base + `cart/remove/${id}`,
  };
}
