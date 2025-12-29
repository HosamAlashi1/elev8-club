import { Injectable } from '@angular/core';

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

/**
 * Google Tag Manager Service
 * استبدال كامل لـ Facebook Pixel - جميع الأحداث تُرسل عبر GTM dataLayer
 */
@Injectable({ providedIn: 'root' })
export class GtmService {
  
  /**
   * دالة أساسية لإرسال أي حدث إلى GTM
   * @param event اسم الحدث
   * @param params البيانات الإضافية
   */
  private pushToDataLayer(event: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event,
        ...params,
        timestamp: new Date().toISOString()
      });
      console.log('GTM Event:', event, params);
    } else {
      console.warn('GTM not available (SSR context)');
    }
  }

  // ========== Base Tracking Method ==========
  
  /**
   * إرسال حدث مخصص
   * @param eventName اسم الحدث
   * @param params البيانات المرفقة
   */
  trackEvent(eventName: string, params?: Record<string, any>) {
    this.pushToDataLayer(eventName, params);
  }

  // ========== Funnel Stage Events ==========

  /**
   * Stage 1: Page View
   * تتبع عرض الصفحة
   */
  trackPageView(pagePath: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('page_view_event', {
      page_path: pagePath,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...additionalParams
    });
  }

  /**
   * Stage 2: View Content
   * تتبع عرض محتوى أو خطوة معينة في الفانل
   */
  trackViewContent(step: number, page: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('view_content_event', {
      content_type: 'funnel_step',
      step,
      page,
      ...additionalParams
    });
  }

  /**
   * Stage 3: Lead Intent
   * عندما يفتح المستخدم نافذة التسجيل (يظهر اهتمام)
   */
  trackLeadIntent(source: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('lead_intent_event', {
      event_category: 'engagement',
      event_action: 'open_registration_modal',
      source,
      ...additionalParams
    });
  }

  /**
   * Stage 4: Lead Submission
   * عندما يرسل المستخدم نموذج التسجيل الأولي
   */
  trackLeadSubmission(leadKey: string, affiliateCode?: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('lead_event', {
      event_category: 'lead_generation',
      event_action: 'form_submitted',
      lead_status: 'submitted',
      lead_id: leadKey,
      affiliate_code: affiliateCode || 'none',
      ...additionalParams
    });
  }

  /**
   * Stage 5a: Question Form Started
   * عندما يبدأ المستخدم في الإجابة على الأسئلة
   */
  trackQuestionFormStarted(leadKey: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('question_form_started_event', {
      event_category: 'form_interaction',
      event_action: 'questions_started',
      lead_id: leadKey,
      ...additionalParams
    });
  }

  /**
   * Stage 5b: Question Form Progress
   * تتبع تقدم المستخدم في الأسئلة
   */
  trackQuestionFormProgress(
    leadKey: string, 
    questionNumber: number, 
    totalQuestions: number, 
    additionalParams?: Record<string, any>
  ) {
    const progress = Math.round((questionNumber / totalQuestions) * 100);
    
    this.pushToDataLayer('question_form_progress_event', {
      event_category: 'form_interaction',
      event_action: 'question_answered',
      lead_id: leadKey,
      question_number: questionNumber,
      total_questions: totalQuestions,
      progress_percentage: progress,
      ...additionalParams
    });
  }

  /**
   * Stage 6: Complete Registration
   * عندما ينهي المستخدم جميع الأسئلة
   */
  trackCompleteRegistration(leadKey: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('registration_event', {
      event_category: 'conversion',
      event_action: 'registration_completed',
      lead_id: leadKey,
      ...additionalParams
    });
  }

  /**
   * Stage 7: WhatsApp Contact
   * عندما ينقر المستخدم على زر التواصل عبر واتساب
   */
  trackWhatsAppContact(leadKey: string, whatsappNumber: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('contact_event', {
      event_category: 'engagement',
      event_action: 'whatsapp_click',
      contact_method: 'whatsapp',
      lead_id: leadKey,
      destination: whatsappNumber,
      ...additionalParams
    });
  }

  /**
   * Stage 8a: Video Play
   * عندما يبدأ المستخدم بتشغيل فيديو
   */
  trackVideoPlay(videoId: string, leadKey?: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('video_play_event', {
      event_category: 'video_interaction',
      event_action: 'video_started',
      video_id: videoId,
      lead_id: leadKey || 'none',
      ...additionalParams
    });
  }

  /**
   * Stage 8b: Video Complete
   * عندما ينتهي المستخدم من مشاهدة الفيديو
   */
  trackVideoComplete(videoId: string, leadKey?: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('video_complete_event', {
      event_category: 'video_interaction',
      event_action: 'video_completed',
      video_id: videoId,
      lead_id: leadKey || 'none',
      ...additionalParams
    });
  }

  // ========== Additional E-commerce Events ==========

  /**
   * Purchase Event (للمبيعات المستقبلية)
   * @example
   * trackPurchase('ORDER123', 1500, 'USD', [{ id: 'PROD1', name: 'VIP Package', price: 1500, quantity: 1 }])
   */
  trackPurchase(
    transactionId: string,
    value: number,
    currency: string = 'USD',
    items?: Array<{id: string, name: string, price: number, quantity: number}>,
    additionalParams?: Record<string, any>
  ) {
    this.pushToDataLayer('purchase_event', {
      event_category: 'ecommerce',
      event_action: 'purchase',
      transaction_id: transactionId,
      value,
      currency,
      items: items || [],
      ...additionalParams
    });
  }

  /**
   * Add to Cart Event
   */
  trackAddToCart(
    itemId: string,
    itemName: string,
    value: number,
    currency: string = 'USD',
    additionalParams?: Record<string, any>
  ) {
    this.pushToDataLayer('add_to_cart_event', {
      event_category: 'ecommerce',
      event_action: 'add_to_cart',
      item_id: itemId,
      item_name: itemName,
      value,
      currency,
      ...additionalParams
    });
  }

  /**
   * Begin Checkout Event
   */
  trackBeginCheckout(
    value: number,
    currency: string = 'USD',
    items?: Array<{id: string, name: string, price: number, quantity: number}>,
    additionalParams?: Record<string, any>
  ) {
    this.pushToDataLayer('begin_checkout_event', {
      event_category: 'ecommerce',
      event_action: 'checkout_started',
      value,
      currency,
      items: items || [],
      ...additionalParams
    });
  }

  // ========== User Engagement Events ==========

  /**
   * Button Click Event
   */
  trackButtonClick(buttonName: string, buttonLocation: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('button_click_event', {
      event_category: 'engagement',
      event_action: 'button_click',
      button_name: buttonName,
      button_location: buttonLocation,
      ...additionalParams
    });
  }

  /**
   * Scroll Depth Event
   */
  trackScrollDepth(percentage: number, pagePath: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('scroll_depth_event', {
      event_category: 'engagement',
      event_action: 'scroll',
      scroll_percentage: percentage,
      page_path: pagePath,
      ...additionalParams
    });
  }

  /**
   * User Signup/Login Event
   */
  trackUserAuth(action: 'signup' | 'login', userId: string, method?: string, additionalParams?: Record<string, any>) {
    this.pushToDataLayer(action === 'signup' ? 'user_signup_event' : 'user_login_event', {
      event_category: 'user_management',
      event_action: action,
      user_id: userId,
      auth_method: method || 'email',
      ...additionalParams
    });
  }

  /**
   * Search Event
   */
  trackSearch(searchTerm: string, resultCount?: number, additionalParams?: Record<string, any>) {
    this.pushToDataLayer('search_event', {
      event_category: 'search',
      event_action: 'search_performed',
      search_term: searchTerm,
      result_count: resultCount,
      ...additionalParams
    });
  }
}
