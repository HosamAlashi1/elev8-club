import { Component, OnInit } from '@angular/core';
import { ApexChart, ApexLegend } from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Dashboard stats
  numbers: number[] = [0, 0, 0, 0];
  targetNumbers: number[] = [124563, 1234, 856, 5678]; // static
  duration: number = 2000;
  startTime: number = 0;

  topAuthors = [
    { name: 'J.K. Rowling', sales: 124, img: 'assets/img/person.png' },
    { name: 'J.K. Rowling', sales: 124, img: 'assets/img/person.png' },
    { name: 'J.K. Rowling', sales: 124, img: 'assets/img/person.png' }
  ];

  categoryChart = {
    series: [44, 33, 23], // Fiction, Children’s, Academic
    chart: {
      type: 'donut' as const,   //  cast to literal
      height: 240
    } as ApexChart,
    labels: ['Fiction', "Children's", 'Academic'],
    colors: ['#34d399', '#fbbf24', '#3b82f6', '#ef4444'],
    legend: {
      position: 'bottom' as const,  //  cast to literal
      labels: { colors: '#6b7280' }
    } as ApexLegend
  };

  // Refund Rate data
  refundRate = {
    rate: '0.8%',
    change: '-0.3% vs last month',
    changeColor: '#16A34A'
  };

  // Revenue data (سيتم تحميلها من الخدمة)
  revenueData: { month: string; sales: number }[] = [];

  // Recent Orders data
  recentOrders: any[] = [
    {
      book: 'The Great Gatsby',
      customer: 'Sarah Johnson',
      date: '2024-01-15',
      status: 'completed',
      amount: 24.99,
      img: 'assets/img/dashboard/dashboard/recent-orders/book1.png'
    },
    {
      book: 'To Kill a Mockingbird',
      customer: 'Michael Brown',
      date: '2024-01-14',
      status: 'processing',
      amount: 19.99,
      img: 'assets/img/dashboard/dashboard/recent-orders/book2.png'
    },
    {
      book: '1984',
      customer: 'Emily Davis',
      date: '2024-01-14',
      status: 'pending',
      amount: 29.99,
      img: 'assets/img/dashboard/dashboard/recent-orders/book3.png'
    },
  ];

  // Dashboard cards (static)
  dashboardCards = [
    {
      label: 'Total Sales',
      icon: 'fe fe-dollar-sign',
      iconClass: 'icon-sales',
      change: '12.5%',
      prefix: '$'
    },
    {
      label: 'Total Orders',
      icon: 'fe fe-shopping-bag',
      iconClass: 'icon-orders',
      change: '8.3%',
      prefix: ''
    },
    {
      label: 'Active Books',
      icon: 'fe fe-book',
      iconClass: 'icon-books',
      change: '24',
      prefix: ''
    },
    {
      label: 'Total Customers',
      icon: 'fe fe-users',
      iconClass: 'icon-customers',
      change: '145',
      prefix: ''
    }
  ];

  // Top Selling Books data
  topSellingBooks = [
    {
      title: 'The Midnight Library',
      img: 'assets/img/dashboard/dashboard/top-selling/book1.png',
      sold: 1234,
      target: 1500
    },
    {
      title: 'Project Hail Mary',
      img: 'assets/img/dashboard/dashboard/top-selling/book2.png',
      sold: 987,
      target: 1000
    },
    {
      title: 'Dune',
      img: 'assets/img/dashboard/dashboard/top-selling/book3.png',
      sold: 876,
      target: 1000
    },
    {
      title: 'The Silent Patient',
      img: 'assets/img/dashboard/dashboard/top-selling/book4.png',
      sold: 765,
      target: 800
    }
  ];

  ngOnInit(): void {
    this.startTime = performance.now();
    this.animateNumbers();

    // تحميل داتا الـ revenue بعد فترة (محاكاة API call)
    this.loadRevenueData();

    console.log('Dashboard initialized');
  }

  // تحميل داتا الـ revenue
  loadRevenueData(): void {
    // محاكاة API call - نصف ثانية تأخير
    setTimeout(() => {
      // إنشاء داتا لآخر 6 شهور
      this.revenueData = this.generateLastSixMonthsRevenue();
    }, 500);
  }

  // توليد داتا revenue لآخر 6 شهور
  generateLastSixMonthsRevenue(): { month: string; sales: number }[] {
    const currentDate = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const revenueData: { month: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      // أرقام متدرجة ومنطقية
      const baseSales = 50000;
      const variation = Math.floor(Math.random() * 40000); // تنويع بين 0-40k
      const growth = i * 5000; // نمو تدريجي
      const sales = baseSales + variation + growth;

      revenueData.push({ month: monthName, sales });
    }

    return revenueData;
  }

  // Animate dashboard number counters
  animateNumbers(): void {
    const animate = (timestamp: number) => {
      const elapsed = timestamp - this.startTime;
      let progress = elapsed / this.duration;
      progress = 1 - Math.pow(1 - Math.min(progress, 1), 3); // ease-out cubic

      this.numbers = this.targetNumbers.map((target) =>
        Math.min(Math.floor(target * progress), target)
      );

      if (elapsed < this.duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
