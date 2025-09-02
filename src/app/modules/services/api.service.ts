import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}/dashboard/`;

@Injectable({
	providedIn: 'root'
})
export class ApiService {
	// Dashboard
	public dashboard = {
		home: API_BASE_URL + 'home', // POST
	};

	// Admin
	public admin = {
		list: API_BASE_URL + 'admins', // POST
		details: (id: number) => API_BASE_URL + 'admins/' + id, // GET
		add: API_BASE_URL + 'admins/store', // POST
		edit: (id: number) => API_BASE_URL + 'admins/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'admins/destroy/' + id // POST
	};

	// Orders
	public orders = {
		list: API_BASE_URL + 'orders', // POST
		details: (id: number) => API_BASE_URL + 'orders/' + id, // GET
		markAllRead: API_BASE_URL + 'orders/mark-all-read', // POST
		unreadCount: API_BASE_URL + 'orders/unread-count', // GET
	};

	// Tutorial
	public tutorial = {
		list: API_BASE_URL + 'tutorial', // POST
		details: (id: number) => API_BASE_URL + 'tutorial/' + id, // GET
		add: API_BASE_URL + 'tutorial/store', // POST
		edit: (id: number) => API_BASE_URL + 'tutorial/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'tutorial/destroy/' + id // POST
	};

	// Packages
	public packages = {
		list: API_BASE_URL + 'packages', // POST
		details: (id: number) => API_BASE_URL + 'packages/' + id, // GET
		add: API_BASE_URL + 'packages/store', // POST
		edit: (id: number) => API_BASE_URL + 'packages/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'packages/destroy/' + id // POST
	};

	// Package Features
	public packageFeatures = {
		list: API_BASE_URL + 'package-features', // POST
		details: (id: number) => API_BASE_URL + 'package-features/' + id, // GET
		add: API_BASE_URL + 'package-features/store', // POST
		edit: (id: number) => API_BASE_URL + 'package-features/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'package-features/destroy/' + id // POST
	};

	// Payment Methods
	public paymentMethods = {
		list: API_BASE_URL + 'payment-methods', // POST
		details: (id: number) => API_BASE_URL + 'payment-methods/' + id, // GET
		add: API_BASE_URL + 'payment-methods/store', // POST
		edit: (id: number) => API_BASE_URL + 'payment-methods/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'payment-methods/destroy/' + id // POST
	};

	// Features
	public features = {
		list: API_BASE_URL + 'features', // POST
		details: (id: number) => API_BASE_URL + 'features/' + id, // GET
		add: API_BASE_URL + 'features/store', // POST
		edit: (id: number) => API_BASE_URL + 'features/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'features/destroy/' + id // POST
	};

	// Testimonials
	public testimonials = {
		list: API_BASE_URL + 'testimonials', // POST
		details: (id: number) => API_BASE_URL + 'testimonials/' + id, // GET
		add: API_BASE_URL + 'testimonials/store', // POST
		edit: (id: number) => API_BASE_URL + 'testimonials/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'testimonials/destroy/' + id // POST
	};

	// App Previews
	public previews = {
		list: API_BASE_URL + 'previews', // POST
		details: (id: number) => API_BASE_URL + 'previews/' + id, // GET
		add: API_BASE_URL + 'previews/store', // POST
		edit: (id: number) => API_BASE_URL + 'previews/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'previews/destroy/' + id // POST
	};

	// Processes
	public processes = {
		list: API_BASE_URL + 'processes', // POST
		details: (id: number) => API_BASE_URL + 'processes/' + id, // GET
		add: API_BASE_URL + 'processes/store', // POST
		edit: (id: number) => API_BASE_URL + 'processes/update/' + id, // POST
		delete: (id: number) => API_BASE_URL + 'processes/destroy/' + id // POST
	};

	// Contact Messages
	public contactMessages = {
		list: API_BASE_URL + 'contact-messages', // POST
		markAllRead: API_BASE_URL + 'contact-messages/mark-all-read', // POST
		unreadCount: API_BASE_URL + 'contact-messages/unread-count', // GET
		// ملاحظة: بالـ API ما في destroy للـ contact-messages، لو بدك ضيفه هون
	};

	// Settings
	public settings = {
		list: API_BASE_URL + 'settings', // POST
		update: API_BASE_URL + 'settings/update' // POST
	};
}
