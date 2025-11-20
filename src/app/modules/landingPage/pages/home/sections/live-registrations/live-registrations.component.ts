import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-live-registrations',
  templateUrl: './live-registrations.component.html',
  styleUrls: ['./live-registrations.component.css'],
  animations: [
    trigger('slideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate3d(50px,20px,0)' }),
        animate('400ms cubic-bezier(.2,.9,.2,1)', style({ opacity: 1, transform: 'translate3d(0,0,0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translate3d(50px,20px,0)' })),
      ]),
    ]),
  ],
})
export class LiveRegistrationsComponent implements OnInit, OnDestroy {
  registrations = [
    { name: 'أحمد', country: 'مصر' },
    { name: 'محمد', country: 'الأردن' },
    { name: 'ليلى', country: 'السعودية' },
    { name: 'سرين', country: 'تونس' },
    { name: 'علي', country: 'الإمارات' },
    { name: 'هند', country: 'الكويت' },
    { name: 'يوسف', country: 'المغرب' },
    { name: 'سارة', country: 'قطر' },
    { name: 'عمر', country: 'ليبيا' },
    { name: 'نور', country: 'عمان' },
    { name: 'رامي', country: 'لبنان' },
    { name: 'دينا', country: 'الجزائر' },
    { name: 'فهد', country: 'البحرين' },
    { name: 'ريم', country: 'العراق' },
  ];

  currentIndex = 0;
  isVisible = true;

  private intervalId: any = null;
  private hideTimeoutId: any = null;

  ngOnInit(): void {
    console.log('🔔 Live Registrations Component Initialized');
    // Start with visible
    this.isVisible = true;
    console.log('✅ First popup should be visible now');
    
    // Schedule first hide
    this.hideTimeoutId = setTimeout(() => {
      this.isVisible = false;
      console.log('🚫 First popup hidden');
      
      // Start the cycle after first hide
      setTimeout(() => {
        console.log('🔄 Starting cycle');
        this.startCycle();
      }, 4000);
    }, 4000);
  }

  private startCycle(): void {
    this.intervalId = setInterval(() => {
      this.isVisible = true;
      this.currentIndex = (this.currentIndex + 1) % this.registrations.length;
      console.log(`📢 Showing: ${this.registrations[this.currentIndex].name} from ${this.registrations[this.currentIndex].country}`);

      // hide after 4s
      if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = setTimeout(() => {
        this.isVisible = false;
        console.log('🚫 Popup hidden');
      }, 4000);
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
  }
}
