import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private restaurants: any[] = [];
  public selectedRestaurant: any = null;

  constructor(private http: HttpClient) { }

  loadRestaurantsFromJson(): Observable<any[]> {
    return this.http.get<any[]>('../../../assets/json/full_restaurant_data.json');
  }

  setRestaurants(data: any[]) {
    this.restaurants = data;
  }

  getRestaurants(): any[] {
    return this.restaurants;
  }

  getRestaurantById(id: number): any {
    return this.restaurants.find(r => r.id === id);
  }

  addRestaurant(data: any) {
    data.id = Date.now(); // unique id
    this.restaurants.push(data);
  }

  updateRestaurant(id: number, updatedData: any) {
    const index = this.restaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      this.restaurants[index] = { ...this.restaurants[index], ...updatedData };
    }
  }
}
