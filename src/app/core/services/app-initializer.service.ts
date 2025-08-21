import { Injectable } from '@angular/core';
import { LandingService } from '../../modules/services/landing.service';
import { timeout, catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private isDataLoaded = false;
  private cachedData: any = null;

  constructor(private landingService: LandingService) {}

  /**
   * دالة التهيئة التي ستعمل قبل بدء التطبيق
   */
  initialize(): Promise<any> {
    console.log('🚀 APP_INITIALIZER: Starting application initialization...');
    
    return new Promise((resolve, reject) => {
      this.landingService.getHomeData()
        .pipe(
          timeout(15000), // مهلة 15 ثانية
          catchError((error) => {
            console.error('❌ APP_INITIALIZER: Failed to load initial data:', error);
            // في حالة الخطأ، نكمل بالبيانات الاحتياطية
            this.setFallbackData();
            return of({ status: false, data: null, message: 'Using fallback data' });
          }),
          tap((response) => {
            if (response.status && response.data) {
              console.log('✅ APP_INITIALIZER: Data loaded successfully');
              this.cachedData = response.data;
              this.isDataLoaded = true;
            } else {
              console.warn('⚠️ APP_INITIALIZER: Using fallback data');
              this.setFallbackData();
            }
          })
        )
        .subscribe({
          next: () => {
            console.log('🎉 APP_INITIALIZER: Application ready to start');
            resolve(true);
          },
          error: (error) => {
            console.error('💥 APP_INITIALIZER: Critical error:', error);
            this.setFallbackData();
            resolve(true); // نكمل حتى لو فشل
          }
        });
    });
  }

  /**
   * الحصول على البيانات المحملة مسبقاً
   */
  getPreloadedData(): any {
    return this.cachedData;
  }

  /**
   * التحقق من حالة تحميل البيانات
   */
  isAppDataLoaded(): boolean {
    return this.isDataLoaded;
  }

  /**
   * تعيين البيانات الاحتياطية
   */
  private setFallbackData(): void {
    this.cachedData = {
      app_previews: [
        { id: 1, image: 'assets/img/app 1.svg' },
        { id: 2, image: 'assets/img/app 2.svg' },
        { id: 3, image: 'assets/img/app 3.svg' },
        { id: 4, image: 'assets/img/app 4.svg' }
      ],
      features: [
        { id: 1, title: 'AI-Powered Diagnosis', image: 'assets/img/feature 1.svg', description: 'Advanced machine learning algorithms for accurate results' },
        { id: 2, title: 'Mobile App Integration', image: 'assets/img/feature 2.svg', description: 'iOS and Android compatible with easy-to-use interface' },
        { id: 3, title: 'Medical Center Network', image: 'assets/img/feature 3.svg', description: 'Connected with certified healthcare providers' }
      ],
      processes: [
        { id: 1, step: '1', title: 'Order Testing Kit', description: 'Purchase your home testing kit through our app' },
        { id: 2, step: '2', title: 'Follow Instructions', description: 'Use the kit and capture images in the app' },
        { id: 3, step: '3', title: 'AI Analysis', description: 'Our AI system analyzes your test results' },
        { id: 4, step: '4', title: 'Get Results', description: 'Receive instant results and recommendations' }
      ],
      testimonials: [
        { id: 1, name: 'Dr. Sarah Johnson', position: 'Nephrologist', image: 'assets/img/person 1.png', rating: 5, testimonial: 'A game-changing solution for early kidney disease detection.' },
        { id: 2, name: 'Michael Chen', position: 'Patient', image: 'assets/img/person 2.png', rating: 5, testimonial: 'The app made home testing so simple and convenient.' }
      ],
      settings: {
        '': [
          { key: 'hero_title', value: 'Early Detection Saves Lives' },
          { key: 'hero_desc', value: 'Test for kidney disease easily from home with AI-powered results.' },
          { key: 'hero_learn_more_link', value: '#' },
          { key: 'link_ios_app', value: 'https://apps.apple.com' },
          { key: 'link_android_app', value: 'https://play.google.com' },
          { key: 'solution_title', value: 'Revolutionary Home Testing Solution' },
          { key: 'solution_desc', value: 'Our AI-powered system combines convenience with medical expertise.' },
          { key: 'solution_image', value: 'assets/img/testing.jpg' },
          { key: 'hero_image', value: 'assets/img/hero-image.png' },
          { key: 'solution_list_first', value: 'Professional-grade testing kits' },
          { key: 'solution_list_second', value: 'Instant AI analysis' },
          { key: 'solution_list_third', value: 'Direct connection with medical centers' },
          { key: 'solution_list_forth', value: 'Secure and private results' },
          { key: 'process_title', value: 'Simple 4-Step Process' },
          { key: 'features_title', value: 'Key Features' },
          { key: 'app_preview_title', value: 'App Previews' },
          { key: 'testimonial_title', value: 'What People Say' },
          { key: 'get_started_title', value: 'Get Started Today' },
          { key: 'get_started_QR_code_image', value: 'assets/img/QR.svg' },
          { key: 'contact_us_title', value: 'Contact Us' },
          { key: 'footer_title', value: 'Making kidney disease detection accessible and convenient for everyone.' },
          { key: 'tests_completed', value: '10,000+' },
          { key: 'medical_centers', value: '500+' },
          { key: 'accuracy_rate', value: '99.9%' },
          { key: 'customer_support', value: '24/7' },
          { key: 'phone', value: '+1 (555) 123-4567' },
          { key: 'email', value: 'contact@kidneytest.com' },
          { key: 'address', value: '123 Medical Center Drive, Healthcare City, HC 12345' },
          { key: 'facebook', value: 'https://www.facebook.com/' },
          { key: 'twitter', value: 'https://www.twitter.com/' },
          { key: 'instagram', value: 'https://www.instagram.com/' },
          { key: 'linkedin', value: 'https://www.linkedin.com/' }
        ]
      }
    };
    
    this.isDataLoaded = true;
    console.log('🎭 APP_INITIALIZER: Fallback data set');
  }
}
