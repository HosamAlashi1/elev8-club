import { Injectable } from '@angular/core';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class MetaPixelService {
  private callFbq(...args: any[]) {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq(...args);
    } else {
      console.warn('Meta Pixel not loaded yet. Skipped event:', args);
    }
  }

  // ========== Base Tracking Methods ==========
  track(eventName: string, params?: Record<string, any>) {
    if (params) this.callFbq('track', eventName, params);
    else this.callFbq('track', eventName);
  }

  trackCustom(eventName: string, params?: Record<string, any>) {
    if (params) this.callFbq('trackCustom', eventName, params);
    else this.callFbq('trackCustom', eventName);
  }

  // ========== Funnel Stage Helpers ==========

  /**
   * Stage 1: Page View
   * Tracks when a user views a page
   */
  trackPageView(pagePath: string, additionalParams?: Record<string, any>) {
    this.track('PageView', { page_path: pagePath, ...additionalParams });
  }

  /**
   * Stage 2: ViewContent
   * Tracks when a user views specific content/step
   */
  trackViewContent(step: number, page: string, additionalParams?: Record<string, any>) {
    this.track('ViewContent', { step, page, ...additionalParams });
  }

  /**
   * Stage 3: Lead Intent
   * Tracks when a user shows interest (opens registration popup)
   */
  trackLeadIntent(source: string, additionalParams?: Record<string, any>) {
    this.trackCustom('OpenRegistrationModal', { source, ...additionalParams });
    this.track('Lead', { status: 'intent', source, ...additionalParams });
  }

  /**
   * Stage 4: Lead Submission
   * Tracks when a user submits the registration form
   */
  trackLeadSubmission(leadKey: string, affiliateCode?: string, additionalParams?: Record<string, any>) {
    this.track('Lead', {
      status: 'submitted',
      lead_id: leadKey,
      affiliate_code: affiliateCode || 'none',
      ...additionalParams
    });
  }

  /**
   * Stage 5: Question Form Progress
   * Tracks progress through the question form
   */
  trackQuestionFormStarted(leadKey: string, additionalParams?: Record<string, any>) {
    this.trackCustom('QuestionFormStarted', { lead_id: leadKey, ...additionalParams });
  }

  trackQuestionFormProgress(leadKey: string, questionNumber: number, totalQuestions: number, additionalParams?: Record<string, any>) {
    this.trackCustom('QuestionFormProgress', {
      lead_id: leadKey,
      question: questionNumber,
      total: totalQuestions,
      progress: Math.round((questionNumber / totalQuestions) * 100),
      ...additionalParams
    });
  }

  /**
   * Stage 6: Complete Registration
   * Tracks when a user completes all questions
   */
  trackCompleteRegistration(leadKey: string, additionalParams?: Record<string, any>) {
    this.track('CompleteRegistration', { lead_id: leadKey, ...additionalParams });
  }

  /**
   * Stage 7: WhatsApp Contact
   * Tracks when a user clicks WhatsApp contact button
   */
  trackWhatsAppContact(leadKey: string, whatsappNumber: string, additionalParams?: Record<string, any>) {
    this.track('Contact', {
      lead_id: leadKey,
      method: 'whatsapp',
      destination: whatsappNumber,
      ...additionalParams
    });
  }

  /**
   * Stage 8 (Optional): Video Interactions
   * Tracks video play and completion
   */
  trackVideoPlay(videoId: string, leadKey?: string, additionalParams?: Record<string, any>) {
    this.trackCustom('VideoPlay', {
      video_id: videoId,
      lead_id: leadKey || 'none',
      ...additionalParams
    });
  }

  trackVideoComplete(videoId: string, leadKey?: string, additionalParams?: Record<string, any>) {
    this.trackCustom('VideoComplete', {
      video_id: videoId,
      lead_id: leadKey || 'none',
      ...additionalParams
    });
  }
}
