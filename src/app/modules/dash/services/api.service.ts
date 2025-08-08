import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}/`;

@Injectable({
	providedIn: 'root'
})
export class ApiService {

	// Dashboard
	public dashboard = {
		home: API_BASE_URL + 'dashboard',
		statistics: API_BASE_URL + 'dashboard/statistics',
		lookups: API_BASE_URL + 'lookups'
	};

	// admins
	public admin = {
		list: API_BASE_URL + 'admins/list',
		details: (id: number) => API_BASE_URL + 'admins/show/' + id,
		profile: API_BASE_URL + 'profile',
		add: API_BASE_URL + 'admins/create',
		edit: (id: number) => API_BASE_URL + 'admins/update/' + id,
		delete: (id: number) => API_BASE_URL + 'admins/delete/' + id
	};

	// users
	public user = {
		list: API_BASE_URL + 'users/list',
		details: (id: number) => API_BASE_URL + 'users/show/' + id,
		add: API_BASE_URL + 'users/create',
		edit: (id: number) => API_BASE_URL + 'users/update/' + id,
		delete: (id: number) => API_BASE_URL + 'users/delete/' + id,
	};

	// categories
	public category = {
		list: API_BASE_URL + 'categories/list',
		details: (id: number) => API_BASE_URL + 'categories/show/' + id,
		add: API_BASE_URL + 'categories/create',
		edit: (id: number) => API_BASE_URL + 'categories/update/' + id,
		delete: (id: number) => API_BASE_URL + 'categories/delete/' + id
	};

	// meals 
	public meal = {
		list: API_BASE_URL + 'meals/list', // POST
		details: (id: number) => API_BASE_URL + 'meals/show/' + id, // GET
		add: API_BASE_URL + 'meals/create', // POST
		edit: (id: number) => API_BASE_URL + 'meals/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'meals/delete/' + id, // POST
	};

	// roles
	public roles = {
		list: API_BASE_URL + 'roles/list',
		details: (id: number) => API_BASE_URL + 'roles/show/' + id,
		add: API_BASE_URL + 'roles/create',
		edit: (id: number) => API_BASE_URL + 'roles/update/' + id,
		delete: (id: number) => API_BASE_URL + 'roles/delete/' + id,
	}

	// permissions
	public permissions = {
		list: API_BASE_URL + 'permissions/list',
	}

	// restaurants
	public restaurants = {
		list: API_BASE_URL + 'restaurants/list',
		details: (id: number) => API_BASE_URL + 'restaurants/show/' + id,
		add: API_BASE_URL + 'restaurants/create',
		edit: (id: number) => API_BASE_URL + 'restaurants/update/' + id,
		delete: (id: number) => API_BASE_URL + 'restaurants/delete/' + id
	}

	// options
	public options = {
		list: API_BASE_URL + 'options/list',
		details: (id: number) => API_BASE_URL + 'options/show/' + id,
		add: API_BASE_URL + 'options/create',
		edit: (id: number) => API_BASE_URL + 'options/update/' + id,
		delete: (id: number) => API_BASE_URL + 'options/delete/' + id
	}

	// orders
	public orders = {
		list:API_BASE_URL + 'orders/list',
		details: (id: number) => API_BASE_URL + 'orders/show/' + id,
		updateStatus: (id: number) => API_BASE_URL + 'orders/update-status/' + id,
	}

	// statistics and 	reports
	public reports = {
		revenue: API_BASE_URL + 'reports/revenue-chart', // GET 
		topOrders: API_BASE_URL + 'reports/orders-meals-chart', // GET
		orders: API_BASE_URL + 'reports/orders-chart', // GET
		topRestaurants: API_BASE_URL + 'reports/top-restaurants', // GET
	}

	// notifications
	public notifications = {
		send: API_BASE_URL + 'notifications/send', // POST
		list: API_BASE_URL + 'notifications/list', // GET
	}
}
