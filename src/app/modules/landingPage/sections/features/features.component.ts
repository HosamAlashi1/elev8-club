import { Component, AfterViewInit } from '@angular/core';

declare const AOS: any; 

interface FeatureItem {
  icon: string;       
  title: string;      
  description: string;
}

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements AfterViewInit {

  sectionTitle = 'Key Features';
  iconColor = '#A82EDE'; 

  features: FeatureItem[] = [
    {
      icon: 'fas fa-chart-line',
      title: 'AI-Powered Diagnosis',
      description: 'Advanced machine learning algorithms for accurate results'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Mobile App Integration',
      description: 'iOS and Android compatible with easy-to-use interface'
    },
    {
      icon: 'fas fa-hospital',
      title: 'Medical Center Network',
      description: 'Connected with certified healthcare providers'
    },
    {
      icon: 'fas fa-calendar-check',
      title: 'Smart Reminders',
      description: 'Automated appointment scheduling and notifications'
    },
    {
      icon: 'fas fa-language',
      title: 'Multi-language Support',
      description: 'Available in multiple languages including Arabic'
    },
    {
      icon: 'fas fa-file-download',
      title: 'Exportable Reports',
      description: 'Download results in PDF and CSV formats'
    }
  ];

  
  aosDelay(index: number): number {
    return (index % 3) * 300;
  }

  trackByTitle(_i: number, item: FeatureItem): string {
    return item.title;
  }

  ngAfterViewInit(): void {
    try {
      if (typeof AOS !== 'undefined' && AOS?.refresh) {
        AOS.refresh();
      }
    } catch {
      
    }
  }
}
