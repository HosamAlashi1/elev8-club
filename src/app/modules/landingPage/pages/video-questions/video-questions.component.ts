import { Component, OnInit } from '@angular/core';
import * as AOS from 'aos';

interface TradingNumber {
  value: string;
  x: number;
  y: number;
  delay: number;
}

interface PriceTicker {
  symbol: string;
  price: string;
  change: number;
}

@Component({
  selector: 'app-video-questions',
  templateUrl: './video-questions.component.html',
  styleUrls: ['./video-questions.component.css']
})
export class VideoQuestionsComponent implements OnInit {

  tradingNumbers: TradingNumber[] = [
    { value: '+2.5%', x: 15, y: 20, delay: 0 },
    { value: '$1,245', x: 75, y: 15, delay: 0.5 },
    { value: '+5.8%', x: 40, y: 35, delay: 1 },
    { value: '$890', x: 85, y: 45, delay: 1.5 },
    { value: '+3.2%', x: 25, y: 60, delay: 2 },
    { value: '-1.2%', x: 65, y: 70, delay: 0.3 },
    { value: '$2,150', x: 20, y: 80, delay: 0.8 },
    { value: '-0.8%', x: 80, y: 85, delay: 1.3 },
    { value: '$1,890', x: 45, y: 90, delay: 1.8 },
    { value: '-2.1%', x: 55, y: 75, delay: 2.3 }
  ];

  priceTickers: PriceTicker[] = [
    { symbol: 'BTC/USD', price: '45,230', change: 2.5 },
    { symbol: 'ETH/USD', price: '2,890', change: 3.8 },
    { symbol: 'EUR/USD', price: '1.0845', change: -0.5 },
    { symbol: 'GBP/USD', price: '1.2650', change: 1.2 },
    { symbol: 'GOLD', price: '2,045', change: 0.8 }
  ];

  constructor() { }

  ngOnInit(): void {
    // Initialize AOS
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: 'ease-out-cubic'
    });

    // Animate trading numbers
    this.animateTradingData();
  }

  ngAfterViewInit(): void {
    // Refresh AOS to detect dynamic elements
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  private animateTradingData(): void {
    setInterval(() => {
      // Update price tickers randomly
      this.priceTickers = this.priceTickers.map(ticker => ({
        ...ticker,
        change: parseFloat((Math.random() * 10 - 5).toFixed(1))
      }));
    }, 3000);
  }

}
