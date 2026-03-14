# Email Campaign Feature - دليل الاستخدام

## 📧 نظام إرسال الإيميلات الجماعية للـ Leads

تم إضافة ميزة جديدة في لوحة التحكم تسمح بإرسال بريد إلكتروني واحد لجميع الـ Leads المسجلين في النظام.

---

## ✅ ما تم إنجازه

### 1️⃣ **Frontend (Angular)**
- ✅ إنشاء صفحة **Email Campaign** في Settings
- ✅ استخدام محرر نصوص غني (Rich Text Editor) باستخدام **ngx-quill**
- ✅ إمكانية كتابة موضوع الإيميل والمحتوى بتنسيقات متعددة
- ✅ فلترة المستلمين (جميع الـ Leads / المكتملين / غير المكتملين)
- ✅ عرض عدد المستلمين المستهدفين
- ✅ معاينة الإيميل قبل الإرسال
- ✅ واجهة متناسقة مع تصميم الداشبورد

### 2️⃣ **Backend (Firebase Functions)**
- ✅ إنشاء **sendBulkEmail** Cloud Function
- ✅ إرسال الإيميلات باستخدام SendGrid API
- ✅ إرسال على دفعات (Batches) لتجنب حدود الإرسال
- ✅ استخدام إعدادات SendGrid من Settings

### 3️⃣ **التكامل**
- ✅ إضافة QuillModule للمحرر النصي
- ✅ إضافة AngularFireFunctionsModule للتواصل مع Cloud Functions
- ✅ إنشاء sendBulkEmail method في ApiAdminService

---

## 🚀 كيفية الاستخدام

### الخطوة 1: إعداد SendGrid
1. اذهب إلى **Settings → General Settings**
2. تأكد من ملء الحقول التالية:
   - **Sender Email**: البريد الإلكتروني المرسل
   - **Sender Name**: اسم المرسل
   - **SendGrid API Key**: مفتاح SendGrid API
3. احفظ الإعدادات

### الخطوة 2: إنشاء حملة بريد إلكتروني
1. اذهب إلى **Settings → Email Campaign**
2. اكتب موضوع الإيميل (Email Subject)
3. اكتب محتوى الإيميل باستخدام المحرر النصي:
   - يمكنك تنسيق النص (عريض، مائل، تسطير)
   - إضافة قوائم مرقمة أو نقطية
   - تغيير الألوان
   - إضافة روابط
4. اختر الفلتر المناسب:
   - **All Leads**: جميع الـ Leads
   - **Completed Only**: فقط الذين أكملوا الأسئلة
   - **Pending Only**: فقط الذين لم يكملوا

### الخطوة 3: الإرسال
1. اضغط على **Show Preview** لمعاينة الإيميل
2. تحقق من عدد المستلمين في القسم الأيمن
3. اضغط **Send Campaign**
4. قم بتأكيد الإرسال
5. انتظر حتى يتم الإرسال (سيظهر مؤشر التحميل)

---

## 📂 الملفات المضافة/المعدلة

### Frontend (Angular)
```
src/app/modules/dash/pages/settings/
├── email-campaign/
│   ├── email-campaign.component.ts    (جديد)
│   ├── email-campaign.component.html  (جديد)
│   └── email-campaign.component.css   (جديد)
├── settings.component.html            (معدل)
└── settings.module.ts                 (معدل)

src/app/modules/services/
└── api.admin.service.ts               (معدل)

src/app/
└── app.module.ts                      (معدل)

angular.json                           (معدل)
```

### Backend (Firebase Functions)
```
functions/
├── src/
│   └── index.ts                       (معدل)
└── package.json                       (معدل)
```

---

## 🔧 المتطلبات الفنية

### npm packages المثبتة:
```json
{
  "ngx-quill": "^22.0.0",
  "quill": "^2.0.2",
  "@sendgrid/mail": "latest"
}
```

---

## ⚙️ خطوات Deploy

### 1. Deploy Frontend
```bash
# في المجلد الرئيسي للمشروع
ng build
# ثم deploy على hosting الخاص بك
```

### 2. Deploy Firebase Functions
```bash
# في مجلد functions
cd functions
npm run build
firebase deploy --only functions
```

---

## 🎨 مميزات التصميم

- ✨ تصميم متجاوب (Responsive) يعمل على جميع الأجهزة
- 🎨 متناسق مع باقي صفحات الداشبورد
- 📊 عرض إحصائيات الحملة (عدد Leads، المستهدفين)
- 👁️ معاينة الإيميل قبل الإرسال
- ⚡ مؤشرات تحميل (Loading States) واضحة
- 🎯 رسائل نجاح وخطأ مناسبة

---

## 🔒 الأمان

- ✅ التحقق من أن المستخدم مصادق عليه (Authenticated)
- ✅ التحقق من صحة البيانات المدخلة
- ✅ استخدام CORS المناسب للـ Cloud Functions
- ✅ حفظ API Keys في Firebase Realtime Database (مشفرة)

---

## 📝 ملاحظات مهمة

1. **حدود SendGrid**:
   - SendGrid Free Plan يسمح بـ 100 إيميل/يوم
   - للخطط المدفوعة، يمكنك إرسال آلاف الإيميلات

2. **الدفعات (Batches)**:
   - تم تقسيم الإرسال إلى دفعات من 100 إيميل
   - هذا يساعد على تجنب الحدود ويحسن الأداء

3. **معالجة الأخطاء**:
   - إذا فشل إرسال بعض الإيميلات، سيستمر النظام في إرسال الباقي
   - ستحصل على تقرير نهائي بعدد الإيميلات المرسلة والفاشلة

4. **فلترة المستلمين**:
   - يتم استبعاد أي lead بدون بريد إلكتروني
   - يتم التحقق من صحة البريد الإلكتروني قبل الإرسال

---

## 🐛 استكشاف الأخطاء

### الخطأ: "SendGrid API key not configured"
**الحل**: اذهب إلى Settings → General Settings وأضف SendGrid API Key

### الخطأ: "Failed to send emails"
**الحل**: 
1. تحقق من صحة SendGrid API Key
2. تحقق من أن البريد المرسل مفعّل في SendGrid
3. راجع Firebase Functions logs

### الخطأ: "No leads match the selected criteria"
**الحل**: قم بتغيير الفلتر إلى "All Leads"

---

## 📞 الدعم

في حال واجهت أي مشاكل، يمكنك:
1. مراجعة Firebase Console → Functions Logs
2. فتح Browser DevTools → Console للأخطاء في Frontend
3. التواصل مع فريق التطوير

---

**تاريخ الإنشاء**: 19 يناير 2026
**الإصدار**: 1.0.0
