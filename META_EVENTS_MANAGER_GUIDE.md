# 📊 دليل قراءة تقارير Meta Events Manager

## 🎯 الهدف
هذا الدليل يشرح كيفية قراءة وتحليل البيانات القادمة من Meta Pixel في حساب الإعلانات.

---

## 📍 كيف تصل لـ Events Manager

1. افتح: https://business.facebook.com/events_manager2
2. اختر حساب الأعمال (Business Account)
3. من القائمة الجانبية → Data Sources → اختر الـ Pixel الخاص بك

---

## 🧪 1. Test Events (للاختبار قبل النشر)

### الخطوات:
1. في Events Manager → اضغط على **Test Events**
2. افتح الموقع في متصفح آخر (أو Incognito)
3. قم بالتفاعل مع الموقع (افتح Modal، سجّل، أكمل الأسئلة)
4. شاهد الأحداث تظهر مباشرة في Test Events

### ما الذي يجب أن تراه:

```
Event                    Parameters                           Time
─────────────────────────────────────────────────────────────────
PageView                 page_path: /home                     12:34:56
ViewContent              step: 1, page: landing_step_1        12:34:56
OpenRegistrationModal    source: hero                         12:35:10
Lead                     status: intent, source: hero         12:35:10
Lead                     status: submitted, lead_id: xyz123   12:35:45
PageView                 page_path: /video-questions          12:35:46
ViewContent              step: 2, page: landing_step_2        12:35:46
QuestionFormStarted      lead_id: xyz123                      12:36:00
QuestionFormProgress     question: 1, progress: 17            12:36:05
QuestionFormProgress     question: 2, progress: 33            12:36:10
...
CompleteRegistration     lead_id: xyz123, questions_count: 6  12:37:00
Contact                  method: whatsapp, lead_id: xyz123    12:37:15
```

### ✅ علامات النجاح:
- جميع الأحداث تظهر في الترتيب الصحيح
- Parameters صحيحة (lead_id، source، affiliate_code)
- لا توجد أخطاء (Error badge)

---

## 📊 2. Overview Dashboard (نظرة عامة)

### الوصول:
Events Manager → Data Sources → Your Pixel → Overview

### ماذا سترى:

#### A. Event Activity (آخر 28 يوم)
```
┌─────────────────────────────────────────────────┐
│  📈 Total Events: 15,234                        │
│                                                  │
│  🔹 PageView:              10,000               │
│  🔹 ViewContent:           10,000               │
│  🔹 Lead (intent):          2,000  (20%)        │
│  🔹 Lead (submitted):       1,400  (70% of intent)
│  🔹 CompleteRegistration:   1,000  (71% of submitted)
│  🔹 Contact:                  600  (60% of completions)
└─────────────────────────────────────────────────┘
```

#### B. Top Events
يظهر لك أكثر الأحداث حدوثاً:
- `PageView` - الأكثر شيوعاً
- `ViewContent` - مساوٍ لـ PageView
- `Lead` - مهم للحملات
- `CompleteRegistration` - أهم Conversion Event

#### C. Event Trends (الرسم البياني)
- اختر الأحداث التي تريد مقارنتها
- مثال: قارن `Lead (submitted)` مع `CompleteRegistration` لرؤية معدل الإكمال

---

## 🔍 3. Event Details (تفاصيل الأحداث)

### الوصول:
Events Manager → Overview → اختر Event معين → View Details

### مثال: تحليل حدث `Lead` (status: submitted)

```
┌─────────────────────────────────────────────────────────┐
│  Event: Lead                                            │
│  Total Events (Last 7 days): 287                        │
│                                                          │
│  🔍 Breakdown by Parameter:                             │
│                                                          │
│  affiliate_code:                                        │
│    • ABC123:      145  (50.5%)  ← أفضل أفلييت          │
│    • XYZ789:       89  (31.0%)                          │
│    • none:         53  (18.5%)  ← بدون أفلييت          │
│                                                          │
│  status:                                                │
│    • submitted:   287  (100%)                           │
│    • intent:        0  (0%)                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**💡 Insight:** الأفلييت ABC123 يجلب 50% من الـ Leads!

---

## 📈 4. Custom Reports (تقارير مخصصة)

### إنشاء تقرير لتحليل Sources

#### الهدف: معرفة أي Section يحول أفضل

**الخطوات:**
1. Events Manager → Custom Reports → Create Report
2. اختر Event: `OpenRegistrationModal`
3. Group By: `source`
4. اختر المدة: آخر 30 يوم

**النتيجة المتوقعة:**
```
┌──────────────────────────────────────────────────────┐
│  Source           Opens    Conversions   CVR         │
├──────────────────────────────────────────────────────┤
│  hero             450      315          70.0%  🥇    │
│  big_cta          280      189          67.5%  🥈    │
│  features         220      132          60.0%        │
│  testimonials     180       99          55.0%        │
│  before_after     150       75          50.0%        │
│  journey           80       32          40.0%  ⚠️    │
└──────────────────────────────────────────────────────┘
```

**💡 Action:**
- ✅ Hero section يحقق أعلى تحويل (70%) - استمر في التركيز عليه
- ⚠️ Journey section يحقق أقل تحويل (40%) - راجع التصميم أو النصوص

---

## 🎯 5. Custom Conversions (تحويلات مخصصة)

### ما هي Custom Conversions؟
تسمح لك بإنشاء "Conversion Events" خاصة بناءً على شروط محددة.

### مثال 1: "High-Intent Lead" (Lead عالي الجودة)

**الشروط:**
- Event: `Lead`
- status = 'submitted'
- source = 'hero' أو 'big_cta'

**الفائدة:**
- استخدمها كـ Optimization Event في الحملات
- استهدف Leads القادمة من أفضل Sources

---

### مثال 2: "Question Form Engaged" (تفاعل مع النموذج)

**الشروط:**
- Event: `QuestionFormProgress`
- progress >= 50

**الفائدة:**
- بناء Custom Audience للـ Retargeting
- معرفة من أكمل نصف النموذج على الأقل

---

### مثال 3: "Video Completers" (مشاهدين الفيديو)

**الشروط:**
- Event: `VideoComplete`

**الفائدة:**
- قياس تأثير الفيديو على التحويل
- إنشاء Lookalike Audience من مشاهدي الفيديو

---

## 👥 6. Custom Audiences (جماهير مخصصة)

### الوصول:
Meta Business Suite → Audiences → Create Audience → Custom Audience → Website Traffic

---

### Audience 1: "Modal Openers - No Submission"

**الهدف:** استهداف من فتح Modal لكن لم يسجل

**الإعداد:**
```
Include people who meet:
  • OpenRegistrationModal in last 7 days

Exclude people who meet:
  • Lead (status: submitted) in last 7 days
```

**الاستخدام:**
- Retargeting campaign بعرض خاص
- رسالة: "كنت قريب من الانضمام! أكمل تسجيلك الآن واحصل على بونس خاص 🎁"

**الحجم المتوقع:** 15-25% من زوار الصفحة

---

### Audience 2: "Incomplete Questions"

**الهدف:** استهداف من سجل لكن لم يكمل الأسئلة

**الإعداد:**
```
Include people who meet:
  • Lead (status: submitted) in last 14 days

Exclude people who meet:
  • CompleteRegistration in last 14 days
```

**الاستخدام:**
- Retargeting campaign بتذكير
- رسالة: "باقي خطوة واحدة! أكمل الأسئلة وانضم للتحدي الآن 🚀"

**الحجم المتوقع:** 20-30% من الـ Leads

---

### Audience 3: "Registration Completers - No Contact"

**الهدف:** استهداف من أكمل التسجيل لكن لم يتواصل

**الإعداد:**
```
Include people who meet:
  • CompleteRegistration in last 30 days

Exclude people who meet:
  • Contact in last 30 days
```

**الاستخدام:**
- Retargeting campaign لتشجيع التواصل
- رسالة: "أكملت التسجيل! تواصل معنا على واتساب الآن للبدء 💬"

**الحجم المتوقع:** 30-40% من المكملين

---

### Audience 4: "Video Watchers - High Quality"

**الهدف:** من شاهد الفيديو وأكمل التسجيل (Seed Audience للـ Lookalike)

**الإعداد:**
```
Include people who meet ALL:
  • VideoComplete in last 90 days
  • CompleteRegistration in last 90 days
```

**الاستخدام:**
- إنشاء Lookalike Audience 1-2%
- هؤلاء الأشخاص أظهروا اهتمام عالي

**الحجم المتوقع:** 500-1000 شخص (بعد شهر من الإطلاق)

---

## 🔄 7. Lookalike Audiences (جماهير مشابهة)

### متى تنشئ Lookalike؟
عندما يكون لديك **على الأقل 100-1000 شخص** في Source Audience

---

### Lookalike 1: Based on "CompleteRegistration"

**الإعداد:**
- Source: Custom Audience من CompleteRegistration
- Location: Jordan, Saudi Arabia, UAE (حسب استهدافك)
- Audience Size: 1% (أقرب شبه)

**الاستخدام:**
- Cold traffic campaign
- رسالة: نفس رسائل الحملة الأساسية

**الحجم:** ~100,000 شخص (لكل دولة)

---

### Lookalike 2: Based on "Contact" (Highest Quality)

**الإعداد:**
- Source: Custom Audience من Contact event
- Location: Jordan, Saudi Arabia, UAE
- Audience Size: 1%

**الاستخدام:**
- Premium campaign بميزانية أعلى
- هؤلاء أشبه بالأشخاص الذين تواصلوا فعلياً

**ملاحظة:** انتظر حتى يصل عدد Contact events لـ 100+ على الأقل

---

## 📉 8. Funnel Analysis (تحليل القمع)

### إنشاء Funnel Report

**الخطوات:**
1. Events Manager → Custom Reports → Funnel Analysis
2. أضف الأحداث بالترتيب:

```
Step 1: PageView (/home)
   ↓
Step 2: OpenRegistrationModal
   ↓
Step 3: Lead (status: submitted)
   ↓
Step 4: QuestionFormStarted
   ↓
Step 5: CompleteRegistration
   ↓
Step 6: Contact
```

**النتيجة:**
```
┌─────────────────────────────────────────────────────┐
│  📊 Conversion Funnel (Last 30 days)                │
├─────────────────────────────────────────────────────┤
│  Step 1: PageView              10,000   (100%)      │
│  Step 2: Modal Open             2,000   ( 20%) ⬇️   │
│  Step 3: Lead Submitted         1,400   ( 70%) ✅   │
│  Step 4: Form Started           1,300   ( 93%) ✅   │
│  Step 5: Registration Complete  1,000   ( 77%) ⚠️   │
│  Step 6: WhatsApp Contact         600   ( 60%) ⚠️   │
└─────────────────────────────────────────────────────┘
```

**💡 Insights:**
- ⬇️ **Modal Open (20%)**: أكبر تسريب - اختبر تصاميم CTAs مختلفة
- ✅ **Lead Submitted (70%)**: جيد جداً - الـ Modal مقنع
- ⚠️ **Complete Registration (77%)**: فرصة للتحسين - قلل عدد الأسئلة؟
- ⚠️ **Contact (60%)**: أضف urgency للـ CTA

---

## 🎨 9. Attribution Analysis (تحليل الإسناد)

### السؤال: هل مشاهدة الفيديو تحسّن التحويل؟

**الطريقة:**

#### Audience A: Video Watchers
```
Include: VideoComplete
```

#### Audience B: Video Non-Watchers
```
Include: ViewContent (step: 2)
Exclude: VideoPlay
```

**قارن:**
- CompleteRegistration rate لكل جمهور
- Contact rate لكل جمهور

**مثال نتيجة:**
```
┌──────────────────────────────────────────────────┐
│  Audience          Complete   Contact   Overall  │
│                    Rate        Rate      CVR     │
├──────────────────────────────────────────────────┤
│  Video Watchers    85%         70%      59.5%    │
│  Non-Watchers      70%         55%      38.5%    │
├──────────────────────────────────────────────────┤
│  Difference        +15%        +15%     +21%  📈 │
└──────────────────────────────────────────────────┘
```

**💡 Action:** الفيديو يحسّن التحويل بـ 21%! شجّع المستخدمين على مشاهدته

---

## 🚨 10. Troubleshooting in Events Manager

### مشكلة: أرى أحداث مكررة

**السبب:** `PageView` يتم إرساله مرتين (من index.html ومن Angular)

**الحل:**
1. اذهب لـ index.html
2. احذف السطر: `fbq('track', 'PageView');`
3. اترك Angular يتولى tracking الـ PageView

---

### مشكلة: Parameters غير صحيحة

**مثال:** `affiliate_code` يظهر `undefined` بدلاً من `none`

**التشخيص:**
1. افتح Browser Console
2. اكتب: `fbq('getState')`
3. شاهد الـ events queue

**الحل:** راجع الكود في `meta-pixel.service.ts` وتأكد من:
```typescript
affiliate_code: this.affiliateCode || 'none'  // ← وليس undefined
```

---

### مشكلة: أحداث لا تظهر لبعض المستخدمين

**الأسباب المحتملة:**
1. ❌ **Ad Blocker مفعّل** - يحظر Facebook Pixel
   - **الحل:** أطلب منهم تعطيله أو استخدم Conversion API

2. ❌ **iOS 14.5+ مع ATT disabled** - Apple privacy features
   - **الحل:** استخدم Aggregated Event Measurement

3. ❌ **VPN/Proxy** - يمنع requests لـ Facebook
   - **الحل:** لا شيء يمكن فعله (قيد خصوصية المستخدم)

---

## 📱 11. Mobile App (Facebook Business Suite App)

### تتبع الأحداث من الهاتف:

1. حمّل **Meta Business Suite** app
2. اذهب لـ: Events Manager
3. اختر الـ Pixel
4. شاهد Real-time events

**فائدة:** راقب الأحداث وأنت خارج المكتب!

---

## 📊 12. Key Metrics to Monitor Daily

### Dashboard يومي (ما يجب مراقبته):

```
┌─────────────────────────────────────────────────┐
│  📊 Daily Dashboard (Today vs. Yesterday)       │
├─────────────────────────────────────────────────┤
│  PageView                 450    (+12%)  ✅     │
│  Lead (submitted)          89    (+5%)   ✅     │
│  CompleteRegistration      65    (-8%)   ⚠️     │
│  Contact                   38    (-12%)  🚨     │
│                                                  │
│  Conversion Rates:                              │
│  Modal Open → Lead:       72%    (+2%)   ✅     │
│  Lead → Complete:         73%    (-10%)  ⚠️     │
│  Complete → Contact:      58%    (-7%)   ⚠️     │
└─────────────────────────────────────────────────┘
```

**💡 Action Items:**
- 🚨 Contact rate نزل 12% - check WhatsApp CTA copy
- ⚠️ Complete rate نزل 10% - هل في مشكلة تقنية؟

---

## 🎯 13. Weekly Review Checklist

### كل أسبوع، راجع:

- [ ] **Funnel Drop-off Points** - أين أكبر تسريب؟
- [ ] **Source Performance** - أي section يحول أفضل؟
- [ ] **Affiliate Attribution** - أي affiliate يجلب أفضل leads؟
- [ ] **Video Impact** - هل الفيديو يحسّن التحويل؟
- [ ] **Device Breakdown** - Mobile vs Desktop performance
- [ ] **Geographic Performance** - أي دولة تحول أفضل؟

---

## 📚 Resources

### روابط مفيدة:
- **Events Manager:** https://business.facebook.com/events_manager2
- **Custom Conversions:** https://www.facebook.com/business/help/742478679120153
- **Custom Audiences:** https://www.facebook.com/business/help/744354708981227
- **Lookalike Audiences:** https://www.facebook.com/business/help/164749007013531
- **Facebook Pixel Helper:** https://chrome.google.com/webstore/detail/facebook-pixel-helper

---

## 🎉 الخلاصة

Meta Events Manager أداة قوية لتحليل رحلة المستخدم وتحسين الحملات الإعلانية.

**أهم 3 تقارير:**
1. **Funnel Analysis** - لمعرفة Drop-off points
2. **Source Attribution** - لمعرفة Best-performing sections
3. **Custom Audiences** - للـ Retargeting

**ابدأ الآن:**
1. افتح Events Manager
2. اذهب لـ Test Events
3. اختبر الموقع
4. شاهد البيانات تتدفق! 🚀

---

**آخر تحديث:** نوفمبر 2025  
**الحالة:** جاهز للاستخدام
