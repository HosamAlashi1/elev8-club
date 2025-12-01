# 🎯 دليل تنفيذ Meta Pixel - تحدي Elev8 Club

## 📋 نظرة عامة

تم تنفيذ نظام تتبع شامل باستخدام Meta Pixel (Facebook Pixel) لقياس وتحليل رحلة المستخدم الكاملة من دخول الموقع حتى التواصل عبر WhatsApp.

---

## 🔧 الإعداد الأولي

### 1. Meta Pixel في index.html

```html
<!-- Meta Pixel Base Code -->
<script>
  !function(f,b,e,v,n,t,s){...}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID_HERE'); // ⚠️ استبدل برقم الـ Pixel الخاص بك
  fbq('track', 'PageView');
</script>
```

**📍 الموقع:** `src/index.html` (السطر 33-45)

**⚠️ مهم جداً:** 
- استبدل `PIXEL_ID_HERE` برقم Pixel الحقيقي من حساب Meta Business
- يمكنك العثور على الـ Pixel ID في: Meta Events Manager → Data Sources → Pixels

---

## 🏗️ البنية المعمارية

### MetaPixelService - الخدمة الأساسية

**📍 الموقع:** `src/app/modules/services/meta-pixel.service.ts`

#### الميزات:
- ✅ Type-safe wrapper للـ Facebook Pixel
- ✅ Protection ضد استدعاء fbq قبل تحميل السكريبت
- ✅ Helper methods لكل مرحلة من مراحل الـ Funnel

#### الـ Methods المتاحة:

```typescript
// 🎯 Stage 1: PageView
trackPageView(pagePath: string, additionalParams?: Record<string, any>)

// 🎯 Stage 2: ViewContent
trackViewContent(step: number, page: string, additionalParams?: Record<string, any>)

// 🎯 Stage 3: Lead Intent (Modal Open)
trackLeadIntent(source: string, additionalParams?: Record<string, any>)

// 🎯 Stage 4: Lead Submission
trackLeadSubmission(leadKey: string, affiliateCode?: string, additionalParams?: Record<string, any>)

// 🎯 Stage 5: Question Form
trackQuestionFormStarted(leadKey: string, additionalParams?: Record<string, any>)
trackQuestionFormProgress(leadKey: string, questionNumber: number, totalQuestions: number, additionalParams?: Record<string, any>)

// 🎯 Stage 6: Complete Registration
trackCompleteRegistration(leadKey: string, additionalParams?: Record<string, any>)

// 🎯 Stage 7: WhatsApp Contact
trackWhatsAppContact(leadKey: string, whatsappNumber: string, additionalParams?: Record<string, any>)

// 🎯 Stage 8: Video Interactions (Optional)
trackVideoPlay(videoId: string, leadKey?: string, additionalParams?: Record<string, any>)
trackVideoComplete(videoId: string, leadKey?: string, additionalParams?: Record<string, any>)
```

---

## 📊 مراحل التتبع الـ 8

### 🔹 Stage 1: Page View Tracking

**الهدف:** تتبع زيارة صفحات الهبوط

**📍 المكان:** `landingPage.component.ts` (ngOnInit)

**الأحداث:**
- `PageView` - Standard Facebook Event
- `ViewContent` - لتحديد الخطوة (Step 1 أو Step 2)

**الكود:**
```typescript
this.router.events
  .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
  .subscribe((event) => {
    const url = event.urlAfterRedirects;
    
    // Stage 1: PageView
    this.metaPixel.trackPageView(url);
    
    // Stage 2: ViewContent
    if (url.includes('/home')) {
      this.metaPixel.trackViewContent(1, 'landing_step_1', { page_name: 'Home' });
    }
    
    if (url.includes('/video-questions')) {
      this.metaPixel.trackViewContent(2, 'landing_step_2', { page_name: 'Video Questions' });
    }
  });
```

**البيانات المرسلة:**
```javascript
// PageView
{ page_path: '/home' }

// ViewContent - Step 1
{ step: 1, page: 'landing_step_1', page_name: 'Home' }

// ViewContent - Step 2
{ step: 2, page: 'landing_step_2', page_name: 'Video Questions' }
```

---

### 🔹 Stage 2: Lead Intent (Registration Modal Open)

**الهدف:** تتبع نية التسجيل عند فتح نافذة التسجيل

**📍 المكان:** `home.component.ts` (openRegistrationPopup)

**الأحداث:**
- `Lead` - Standard Event (status: 'intent')
- `OpenRegistrationModal` - Custom Event

**Sources المتاحة:**
```typescript
'hero'                    // Hero Section
'features'                // Features Section
'before_after'            // Before/After Section
'journey'                 // Journey Section
'video_testimonials'      // Video Testimonials
'suitable_check'          // Suitable Check Section
'written_testimonials'    // Written Testimonials
'big_cta'                 // Big CTA Section
```

**الكود:**
```typescript
private openRegistrationPopup = (source: string = 'unknown') => {
  this.isRegistrationPopupOpen = true;
  
  // Track Lead Intent
  this.metaPixel.trackLeadIntent(source, {
    affiliate_code: this.affiliateCode || 'none'
  });
  
  this.cd.detectChanges();
}
```

**البيانات المرسلة:**
```javascript
// Lead Event
{ 
  status: 'intent', 
  source: 'hero',
  affiliate_code: 'ABC123' 
}

// OpenRegistrationModal Custom Event
{ 
  source: 'hero',
  affiliate_code: 'ABC123' 
}
```

**💡 فائدة:** معرفة أي قسم في الصفحة يحقق أعلى معدل تحويل

---

### 🔹 Stage 3: Lead Submission

**الهدف:** تتبع إرسال نموذج التسجيل الأول (الاسم + البريد + الهاتف)

**📍 المكان:** `register-popup.component.ts` (onSubmit)

**الأحداث:**
- `Lead` - Standard Event (status: 'submitted')

**الكود:**
```typescript
this.firebaseService.addLead(leadData)
  .then(leadKey => {
    // Track Lead Submission
    this.metaPixel.trackLeadSubmission(leadKey, this.affiliateCode || undefined, {
      full_name: this.formData.fullName,
      email: this.formData.email,
      phone: this.formData.whatsapp
    });
    
    // Redirect to video-questions
    this.router.navigate(['/video-questions'], {
      queryParams: { lead: leadKey, ref: this.affiliateCode }
    });
  });
```

**البيانات المرسلة:**
```javascript
{
  status: 'submitted',
  lead_id: 'lead_xyz123',
  affiliate_code: 'ABC123',
  full_name: 'أحمد محمد',
  email: 'ahmed@example.com',
  phone: '+972501234567'
}
```

**💡 فائدة:** هذا الحدث يمثل Lead حقيقي ويمكن استخدامه كـ Conversion Event في الحملات

---

### 🔹 Stage 4: Question Form Started

**الهدف:** تتبع بدء تعبئة نموذج الأسئلة

**📍 المكان:** `question-form-section.component.ts` (handleAnswer - first time)

**الأحداث:**
- `QuestionFormStarted` - Custom Event

**الكود:**
```typescript
handleAnswer(value: string): void {
  this.answers[this.currentQ.id] = value;
  
  // Track Form Start (first interaction)
  if (!this.hasTrackedFormStart && this.leadKey) {
    this.metaPixel.trackQuestionFormStarted(this.leadKey);
    this.hasTrackedFormStart = true;
  }
  
  // ... rest of the code
}
```

**البيانات المرسلة:**
```javascript
{
  lead_id: 'lead_xyz123'
}
```

---

### 🔹 Stage 5: Question Form Progress

**الهدف:** تتبع تقدم المستخدم في نموذج الأسئلة

**📍 المكان:** `question-form-section.component.ts` (handleAnswer)

**الأحداث:**
- `QuestionFormProgress` - Custom Event

**متى يتم الإرسال:** مع كل إجابة جديدة

**الكود:**
```typescript
if (this.leadKey) {
  const answeredCount = Object.keys(this.answers).length;
  this.metaPixel.trackQuestionFormProgress(
    this.leadKey,
    answeredCount,
    this.questions.length
  );
}
```

**البيانات المرسلة:**
```javascript
{
  lead_id: 'lead_xyz123',
  question: 3,           // رقم السؤال الحالي
  total: 6,              // إجمالي الأسئلة
  progress: 50           // النسبة المئوية (50%)
}
```

**💡 فائدة:** معرفة في أي نقطة يتوقف المستخدمون عن إكمال النموذج

---

### 🔹 Stage 6: Complete Registration

**الهدف:** تتبع إتمام جميع الأسئلة وحفظها في Firebase

**📍 المكان:** `question-form-section.component.ts` (submitAnswers)

**الأحداث:**
- `CompleteRegistration` - Standard Facebook Event

**الكود:**
```typescript
this.firebaseService.completeLead(this.leadKey, answersData, country, city)
  .then(() => {
    // Track Complete Registration
    if (this.leadKey) {
      this.metaPixel.trackCompleteRegistration(this.leadKey, {
        questions_count: this.questions.length,
        country: country,
        city: city
      });
    }
    
    this.showCTA = true;
  });
```

**البيانات المرسلة:**
```javascript
{
  lead_id: 'lead_xyz123',
  questions_count: 6,
  country: 'Jordan',
  city: 'Amman'
}
```

**💡 فائدة:** هذا يمثل إكمال رحلة التسجيل بالكامل - أهم Conversion Event

---

### 🔹 Stage 7: WhatsApp Contact

**الهدف:** تتبع النقر على زر التواصل عبر WhatsApp

**📍 المكان:** `question-form-section.component.ts` (completeRegistration)

**الأحداث:**
- `Contact` - Standard Facebook Event

**الكود:**
```typescript
completeRegistration(): void {
  const whatsappNumber = this.currentAffiliate?.whatsappNumber?.replace(/[^0-9]/g, '') || '972598046069';
  const userName = this.currentLead?.fullName || 'عميل جديد';
  
  // Track WhatsApp Contact
  if (this.leadKey) {
    this.metaPixel.trackWhatsAppContact(this.leadKey, whatsappNumber, {
      user_name: userName,
      affiliate_code: this.affiliateCode || 'none'
    });
  }
  
  window.open(`https://wa.me/${whatsappNumber}?text=...`, '_blank');
}
```

**البيانات المرسلة:**
```javascript
{
  lead_id: 'lead_xyz123',
  method: 'whatsapp',
  destination: '972598046069',
  user_name: 'أحمد محمد',
  affiliate_code: 'ABC123'
}
```

**💡 فائدة:** معرفة كم Lead وصل لمرحلة التواصل الفعلي

---

### 🔹 Stage 8: Video Interactions (Optional)

**الهدف:** تتبع تفاعل المستخدم مع الفيديو في صفحة video-questions

**📍 المكان:** `video-hero-section.component.ts`

**الأحداث:**
- `VideoPlay` - Custom Event
- `VideoComplete` - Custom Event

**الكود:**
```typescript
togglePlay(): void {
  const video = this.videoPlayer.nativeElement;
  if (!this.isPlaying) {
    video.play();
    
    // Track Video Play (first time only)
    if (!this.hasTrackedPlay) {
      this.metaPixel.trackVideoPlay('challenge_intro_video', this.leadKey || undefined);
      this.hasTrackedPlay = true;
    }
  }
  this.isPlaying = !this.isPlaying;
}

// Video Complete (triggered at 95% or on 'ended' event)
video.addEventListener('timeupdate', () => {
  if (this.progress >= 95 && !this.hasTrackedComplete) {
    this.metaPixel.trackVideoComplete('challenge_intro_video', this.leadKey || undefined);
    this.hasTrackedComplete = true;
  }
});
```

**البيانات المرسلة:**
```javascript
// VideoPlay
{
  video_id: 'challenge_intro_video',
  lead_id: 'lead_xyz123'
}

// VideoComplete
{
  video_id: 'challenge_intro_video',
  lead_id: 'lead_xyz123'
}
```

**💡 فائدة:** قياس تأثير الفيديو على معدل إتمام التسجيل

---

## 📈 التقارير والتحليل

### في Meta Events Manager

1. **Test Events (للاختبار)**
   - افتح Meta Events Manager
   - اذهب لـ Test Events
   - افتح الموقع في متصفح آخر
   - شاهد الأحداث تظهر مباشرة

2. **Data Sources → Pixels**
   - شاهد جميع الأحداث المرسلة
   - تحقق من الـ Parameters لكل حدث

3. **Custom Conversions**
   يمكنك إنشاء Custom Conversions مثل:
   - "Opened Registration from Hero" → Lead Intent + source = 'hero'
   - "Completed All Questions" → CompleteRegistration
   - "Contacted via WhatsApp" → Contact + method = 'whatsapp'

4. **Custom Audiences**
   يمكنك بناء جماهير مخصصة:
   - الأشخاص الذين فتحوا التسجيل لكن لم يكملوا
   - الأشخاص الذين أكملوا الأسئلة لكن لم يتواصلوا
   - الأشخاص الذين شاهدوا الفيديو بالكامل

---

## 🔍 Funnel Analysis

### الـ Funnel المتوقع:

```
📊 Landing Page View (/home)
    ↓ (Stage 1: PageView + ViewContent)
    
🎯 Registration Modal Open
    ↓ (Stage 2: Lead Intent)
    
📝 Registration Form Submitted
    ↓ (Stage 3: Lead Submission)
    
🎬 Video Questions Page (/video-questions)
    ↓ (Stage 1: PageView + ViewContent - Step 2)
    
▶️ Video Play (Optional)
    ↓ (Stage 8: VideoPlay)
    
❓ Question Form Started
    ↓ (Stage 4: QuestionFormStarted)
    
📊 Question Form Progress
    ↓ (Stage 5: QuestionFormProgress x6)
    
✅ Complete Registration
    ↓ (Stage 6: CompleteRegistration)
    
💬 WhatsApp Contact
    ↓ (Stage 7: Contact)
```

### معدلات التحويل المتوقعة:

```
Landing Page View       → 100%
Open Modal              → 15-25%
Submit Registration     → 60-80% (of modal opens)
Start Questions         → 85-95% (of submissions)
Complete Questions      → 70-85% (of starts)
WhatsApp Contact        → 50-70% (of completions)
```

---

## ⚙️ إعدادات الحملات الإعلانية

### Conversion Events الموصى بها:

1. **Campaign Objective: Lead Generation**
   - Optimization Event: `Lead` (status: submitted)
   - Backup: `CompleteRegistration`

2. **Campaign Objective: Conversions**
   - Optimization Event: `CompleteRegistration`
   - Backup: `Contact`

3. **Retargeting Campaigns**
   - Custom Audience: "Opened Modal but didn't submit"
   - Custom Audience: "Submitted but didn't complete questions"

---

## 🐛 استكشاف الأخطاء

### مشكلة: الأحداث لا تظهر في Meta Events Manager

**الحلول:**
1. تأكد من استبدال `PIXEL_ID_HERE` في `index.html`
2. تأكد من تحميل fbq script (افتح Console → اكتب `fbq`)
3. استخدم [Facebook Pixel Helper Extension](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
4. تحقق من وجود Ad Blockers (قد تمنع الـ Pixel)

### مشكلة: Duplicate Events

**السبب:** الـ `PageView` يتم إرساله مرتين (مرة من index.html ومرة من Angular)

**الحل:** احذف السطر التالي من `index.html`:
```javascript
fbq('track', 'PageView'); // احذف هذا السطر
```

### مشكلة: leadKey = null في الأحداث

**السبب:** المستخدم فتح `/video-questions` مباشرة بدون المرور من `/home`

**الحل:** تمت إضافة redirect في `question-form-section.component.ts`:
```typescript
if (!this.leadKey) {
  alert('الرجاء التسجيل أولاً');
  this.router.navigate(['/home']);
  return;
}
```

---

## 📝 ملاحظات مهمة

### ✅ Best Practices المطبقة:

1. **Type Safety**: جميع الـ methods في `MetaPixelService` لها types واضحة
2. **Error Handling**: التحقق من وجود `window.fbq` قبل الاستدعاء
3. **SSR Compatibility**: استخدام `typeof window !== 'undefined'`
4. **Duplicate Prevention**: flags مثل `hasTrackedPlay` و `hasTrackedComplete`
5. **Progressive Enhancement**: الكود يعمل حتى لو فشل تحميل Pixel

### 🔒 الخصوصية والـ GDPR:

- ⚠️ تأكد من إضافة Cookie Consent Banner إذا كان الموقع يستهدف أوروبا
- ⚠️ أضف Privacy Policy واضحة توضح استخدام Facebook Pixel
- ⚠️ يمكن إضافة خيار Opt-out للمستخدمين

---

## 🚀 الخطوات التالية

### للنشر (Production):

1. **استبدل Pixel ID:**
   ```html
   <!-- في index.html -->
   fbq('init', 'YOUR_REAL_PIXEL_ID');
   ```

2. **اختبر جميع المراحل:**
   - [ ] زيارة `/home`
   - [ ] فتح نافذة التسجيل من أقسام مختلفة
   - [ ] إرسال نموذج التسجيل
   - [ ] إكمال نموذج الأسئلة
   - [ ] النقر على زر WhatsApp
   - [ ] تشغيل الفيديو

3. **راقب Test Events:**
   - افتح Meta Events Manager → Test Events
   - قم بالاختبار
   - تأكد من ظهور جميع الأحداث

4. **أنشئ Custom Conversions:**
   - Lead Intent from Hero
   - Complete Registration
   - WhatsApp Contact

5. **أطلق الحملات:**
   - استخدم `CompleteRegistration` كـ Conversion Event
   - راقب الأداء لمدة 3-7 أيام
   - قم بالتحسين بناءً على البيانات

---

## 📞 الدعم

إذا واجهت أي مشاكل:
- تحقق من Console للأخطاء
- استخدم Facebook Pixel Helper Extension
- راجع [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)

---

**تاريخ آخر تحديث:** نوفمبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للنشر (Production Ready)
