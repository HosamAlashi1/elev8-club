import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CheckoutAdapter {
  async initiatePayment(orderId: string, method: 'mock' | 'stripe' | 'paypal' = 'mock') {
    switch(method) {
      case 'mock':
        return `https://payment-gateway-mock.com/pay/${orderId}`;
      case 'stripe':
        // return await callStripe(orderId);
        break;
      case 'paypal':
        // return await callPaypal(orderId);
        break;
    }
    return null;
  }
}