# دليل إعداد واستخدام Firebase للنظام

## 📋 نظرة عامة

تم تطوير نظام متكامل لإدارة Leads قادمة من Landing Page مع تتبع:
- **النسخة** (Version) - أي نسخة من اللاندنج
- **المسوق** (Affiliate) - من جلب هذا الشخص
- **البيانات** (Lead) - معلومات المستخدم + إجاباته

---

## 🗄️ هيكل قاعدة البيانات

### 1️⃣ جدول `versions` - نسخ اللاندنج

```json
{
  "versions": {
    "randomKey123": {
      "key": "randomKey123",
      "name": "تحدي 7 أيام – نسخة رمضان",
      "isCurrent": true,
      "createdAt": "2025-02-20T12:00:00Z"
    }
  }
}
```

**الحقول:**
- `key`: ID النسخة (نفس مفتاح Firebase)
- `name`: اسم النسخة للعرض في الداشبورد
- `isCurrent`: هل هذه النسخة النشطة حاليًا؟
- `createdAt`: تاريخ إنشاء النسخة

---

### 2️⃣ جدول `affiliates` - المسوقين

```json
{
  "affiliates": {
    "affiliateKey456": {
      "key": "affiliateKey456",
      "name": "أحمد المصري",
      "email": "ahmed@example.com",
      "code": "AHM1",
      "whatsappNumber": "+201001112233",
      "createdAt": "2024-12-15T10:00:00Z"
    }
  }
}
```

**الحقول:**
- `key`: ID المسوق
- `name`: اسم المسوق
- `email`: البريد الإلكتروني
- `code`: الكود الفريد (يستخدم في URL: `?ref=AHM1`)
- `whatsappNumber`: رقم واتساب المسوق لإرسال الليدز له
- `createdAt`: تاريخ إضافة المسوق

---

### 3️⃣ جدول `leads` - المستخدمين/الزوار

```json
{
  "leads": {
    "leadKey789": {
      "key": "leadKey789",
      "versionKey": "randomKey123",
      "affiliateKey": "affiliateKey456",
      "affiliateCode": "AHM1",
      "fullName": "خالد محمود",
      "email": "khaled@example.com",
      "phone": "+201224445566",
      "country": "مصر",
      "city": "القاهرة",
      "step": 2,
      "consent": true,
      "answers": {
        "experienceLevel": "beginner",
        "readyAmount": "<200",
        "readyIn24h": "yes",
        "triedElev8Before": "no",
        "mainGoal": "learn_trading"
      },
      "createdAt": "2025-03-01T18:32:00Z",
      "completedAt": "2025-03-01T18:40:00Z"
    }
  }
}
```

**الحقول الأساسية:**
- `key`: ID الليد
- `versionKey`: مفتاح النسخة (FK)
- `affiliateKey`: مفتاح المسوق (FK - اختياري)
- `affiliateCode`: كود المسوق (للفلترة السريعة)
- `fullName`, `email`, `phone`: بيانات الشخص
- `country`, `city`: الموقع الجغرافي
- `step`: المرحلة (1 = بيانات أولية، 2 = أكمل الأسئلة)
- `consent`: موافقة على التواصل
- `answers`: إجابات الأسئلة الستة
- `createdAt`: وقت التسجيل
- `completedAt`: وقت إكمال الأسئلة

**قيم الإجابات:**
- `experienceLevel`: `"beginner"` | `"intermediate"` | `"advanced"`
- `readyAmount`: `"<200"` | `"200-1000"` | `">1000"`
- `readyIn24h`: `"yes"` | `"no"`
- `triedElev8Before`: `"yes"` | `"no"`
- `mainGoal`: `"ready_trades"` | `"trading_bot"` | `"learn_trading"` | `"steady_income"`

---

## 🔄 مسار المستخدم (User Flow)

### الخطوة 1: دخول من رابط أفلييت
```
https://yourdomain.com/home?ref=AHM1
```
- يتم قراءة `ref=AHM1` وحفظه في localStorage
- يتم جلب بيانات Affiliate من Firebase

### الخطوة 2: تعبئة فورم التسجيل
**في `register-popup`:**
1. المستخدم يدخل (الاسم، الإيميل، رقم الواتساب)
2. يتم إنشاء Lead جديد في Firebase:
   ```typescript
   {
     versionKey: "currentVersionKey",
     affiliateKey: "affiliateKey456",
     affiliateCode: "AHM1",
     fullName: "...",
     email: "...",
     phone: "...",
     step: 1,
     consent: true,
     createdAt: "2025-..."
   }
   ```
3. **يتم التوجيه لصفحة الأسئلة** مع تمرير `leadKey`:
   ```
   /video-questions?lead=leadKey789&ref=AHM1
   ```

### الخطوة 3: إكمال الأسئلة
**في `question-form`:**
1. يتم جلب الـ Lead من Firebase بناءً على `leadKey`
2. المستخدم يجاوب على 6 أسئلة
3. عند الانتهاء، يتم تحديث الـ Lead:
   ```typescript
   {
     step: 2,
     answers: { ... },
     country: "مصر",
     city: "القاهرة",
     completedAt: "2025-..."
   }
   ```
4. تظهر رسالة نجاح مع زر واتساب للتواصل مع المستشار

---

## 🛠️ الدوال المتاحة في FirebaseService

### دوال Versions
```typescript
// جلب النسخة الحالية النشطة
getCurrentVersion(): Observable<Version | null>

// جلب جميع النسخ
getAllVersions(): Observable<Version[]>

// إضافة نسخة جديدة
addVersion(name: string): Promise<any>

// تفعيل نسخة معينة
setCurrentVersion(versionKey: string): Promise<void>
```

### دوال Affiliates
```typescript
// جلب أفلييت بالكود
getAffiliateByCode(code: string): Observable<Affiliate | null>

// جلب جميع الأفلييت
getAllAffiliates(): Observable<Affiliate[]>

// إضافة أفلييت جديد
addAffiliate(data: Omit<Affiliate, 'key' | 'createdAt'>): Promise<any>
```

### دوال Leads
```typescript
// إضافة Lead جديد (الخطوة 1)
addLead(lead: Omit<Lead, 'key'>): Promise<string>

// تحديث Lead بإجابات (الخطوة 2)
completeLead(leadKey: string, answers: any, country?: string, city?: string): Promise<void>

// جلب Lead بالـ key
getLeadByKey(leadKey: string): Observable<Lead | null>

// جلب Leads لنسخة معينة
getLeadsByVersion(versionKey: string): Observable<Lead[]>

// جلب Leads لأفلييت معين
getLeadsByAffiliate(affiliateKey: string): Observable<Lead[]>

// جلب Leads لنسخة + أفلييت
getLeadsByVersionAndAffiliate(versionKey: string, affiliateCode: string): Observable<Lead[]>

// عدّ Leads حسب step
countLeadsByStep(step: 1 | 2): Observable<number>
```

---

## 📊 أمثلة استعلامات للداشبورد

### 1. عدد Leads في نسخة معينة
```typescript
firebaseService.getLeadsByVersion('versionKey123')
  .subscribe(leads => {
    console.log(`عدد الليدز: ${leads.length}`);
  });
```

### 2. Leads لمسوق معين في نسخة معينة
```typescript
firebaseService.getLeadsByVersionAndAffiliate('versionKey123', 'AHM1')
  .subscribe(leads => {
    console.log(`أحمد جلب: ${leads.length} ليد`);
  });
```

### 3. عدد من أكملوا التسجيل vs الذين تركوا
```typescript
// الذين أكملوا (step = 2)
firebaseService.countLeadsByStep(2).subscribe(completed => {
  console.log(`مكتمل: ${completed}`);
});

// الذين تركوا (step = 1)
firebaseService.countLeadsByStep(1).subscribe(incomplete => {
  console.log(`غير مكتمل: ${incomplete}`);
});
```

### 4. توزيع حسب مستوى الخبرة
```typescript
firebaseService.getLeadsByVersion('versionKey123')
  .subscribe(leads => {
    const completed = leads.filter(l => l.step === 2);
    const distribution = {
      beginner: completed.filter(l => l.answers?.experienceLevel === 'beginner').length,
      intermediate: completed.filter(l => l.answers?.experienceLevel === 'intermediate').length,
      advanced: completed.filter(l => l.answers?.experienceLevel === 'advanced').length
    };
    console.log(distribution);
  });
```

---

## 🚀 خطوات الإعداد الأولية

### 1. إضافة نسخة أولى
```typescript
firebaseService.addVersion('تحدي 7 أيام – نسخة رمضان 2025')
  .then(versionKey => {
    // تفعيل هذه النسخة
    return firebaseService.setCurrentVersion(versionKey);
  });
```

### 2. إضافة مسوقين
```typescript
firebaseService.addAffiliate({
  name: 'أحمد المصري',
  email: 'ahmed@example.com',
  code: 'AHM1',
  whatsappNumber: '+201001112233'
});

firebaseService.addAffiliate({
  name: 'سارة خالد',
  email: 'sara@example.com',
  code: 'SARA2',
  whatsappNumber: '+971501234567'
});
```

### 3. اختبار الفلو
1. افتح: `http://localhost:4200/home?ref=AHM1`
2. سجل بيانات جديدة
3. أكمل الأسئلة
4. تحقق من Firebase أن الداتا محفوظة بشكل صحيح

---

## ⚠️ ملاحظات مهمة

1. **الـ ref code محفوظ في localStorage** - لو المستخدم غير الصفحة وعاد، رح يبقى الكود
2. **step = 1** تعني أنه دخل بيانات أولية فقط
3. **step = 2** تعني أنه أكمل كل شي
4. **رقم واتساب الأفلييت** يستخدم في زر "إكمال التسجيل" بعد الأسئلة
5. كل Lead مرتبط بـ **نسخة واحدة** و **أفلييت واحد** (أو بدون أفلييت)

---

## 📝 TODO لاحقًا

- [ ] إضافة Firebase Cloud Functions لإرسال إيميل ترحيبي عند step=1
- [ ] إضافة Trigger لإرسال واتساب عند step=2
- [ ] بناء داشبورد لعرض التقارير والإحصائيات
- [ ] إضافة validation قوي للأيميل ورقم الهاتف
- [ ] إضافة حماية من التسجيل المكرر (duplicate emails)

---

تم بناء النظام بنجاح! ✅
