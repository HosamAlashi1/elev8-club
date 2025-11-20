// =====================================================
// سكريبت لإضافة البيانات الأولية في Firebase Console
// =====================================================

// الطريقة 1: من خلال Firebase Console مباشرة
// ===================================================
// 1. افتح Firebase Console
// 2. اذهب إلى Realtime Database
// 3. اختر الروت "/" ثم أضف الـ JSON التالي:

{
  "versions": {
    "-NrandomKey1": {
      "key": "-NrandomKey1",
      "name": "تحدي 7 أيام – نسخة رمضان 2025",
      "isCurrent": true,
      "createdAt": "2025-02-20T12:00:00Z"
    }
  },
  "affiliates": {
    "-NaffiliateKey1": {
      "key": "-NaffiliateKey1",
      "name": "أحمد المصري",
      "email": "ahmed.mosary@example.com",
      "code": "AHM1",
      "whatsappNumber": "+201001112233",
      "createdAt": "2024-12-15T10:00:00Z"
    },
    "-NaffiliateKey2": {
      "key": "-NaffiliateKey2",
      "name": "سارة خالد",
      "email": "sara.khaled@example.com",
      "code": "SARA2",
      "whatsappNumber": "+971501234567",
      "createdAt": "2024-12-16T09:30:00Z"
    },
    "-NaffiliateKey3": {
      "key": "-NaffiliateKey3",
      "name": "محمد العلي",
      "email": "mohammed.ali@example.com",
      "code": "MOH3",
      "whatsappNumber": "+966501234567",
      "createdAt": "2024-12-17T08:15:00Z"
    }
  },
  "leads": {}
}

// =====================================================
// الطريقة 2: من خلال Angular Component/Service
// =====================================================

// في أي component، أضف هذا الكود في ngOnInit أو في دالة منفصلة:

import { FirebaseService } from './path-to-firebase-service';

constructor(private firebaseService: FirebaseService) {}

async setupInitialData() {
  try {
    // 1. إضافة النسخة الأولى
    console.log('Adding version...');
    await this.firebaseService.addVersion('تحدي 7 أيام – نسخة رمضان 2025');
    
    // الحصول على النسخة المضافة وتفعيلها
    const versions = await this.firebaseService.getAllVersions().toPromise();
    if (versions && versions.length > 0) {
      await this.firebaseService.setCurrentVersion(versions[0].key);
      console.log('Version activated successfully');
    }

    // 2. إضافة المسوقين
    console.log('Adding affiliates...');
    
    await this.firebaseService.addAffiliate({
      name: 'أحمد المصري',
      email: 'ahmed.mosary@example.com',
      code: 'AHM1',
      whatsappNumber: '+201001112233'
    });
    console.log('Affiliate AHM1 added');

    await this.firebaseService.addAffiliate({
      name: 'سارة خالد',
      email: 'sara.khaled@example.com',
      code: 'SARA2',
      whatsappNumber: '+971501234567'
    });
    console.log('Affiliate SARA2 added');

    await this.firebaseService.addAffiliate({
      name: 'محمد العلي',
      email: 'mohammed.ali@example.com',
      code: 'MOH3',
      whatsappNumber: '+966501234567'
    });
    console.log('Affiliate MOH3 added');

    console.log('✅ All initial data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding initial data:', error);
  }
}

// =====================================================
// الطريقة 3: استخدام Firebase REST API
// =====================================================

// يمكنك استخدام أي HTTP client (مثل Postman أو curl) لإضافة البيانات

// مثال لإضافة نسخة:
// PUT https://your-database.firebaseio.com/versions/-NrandomKey1.json
// Body:
{
  "key": "-NrandomKey1",
  "name": "تحدي 7 أيام – نسخة رمضان 2025",
  "isCurrent": true,
  "createdAt": "2025-02-20T12:00:00Z"
}

// مثال لإضافة أفلييت:
// PUT https://your-database.firebaseio.com/affiliates/-NaffiliateKey1.json
// Body:
{
  "key": "-NaffiliateKey1",
  "name": "أحمد المصري",
  "email": "ahmed.mosary@example.com",
  "code": "AHM1",
  "whatsappNumber": "+201001112233",
  "createdAt": "2024-12-15T10:00:00Z"
}

// =====================================================
// ملاحظات مهمة:
// =====================================================

/*
1. تأكد أن Firebase Rules تسمح بالكتابة:
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }

2. في الإنتاج، يجب تغيير الـ Rules لتكون أكثر أمانًا:
   {
     "rules": {
       "versions": {
         ".read": true,
         ".write": "auth != null"
       },
       "affiliates": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "leads": {
         ".read": "auth != null",
         ".write": true
       }
     }
   }

3. يمكنك إضافة المزيد من النسخ والمسوقين حسب الحاجة

4. كل affiliate يحتاج كود فريد (code) لا يتكرر

5. في أي وقت، يجب أن يكون هناك نسخة واحدة فقط مع isCurrent: true
*/

// =====================================================
// للاختبار السريع - Test Data
// =====================================================

// Lead تجريبي للاختبار (سيتم إنشاؤه تلقائيًا عند التسجيل)
{
  "leads": {
    "-NtestLead1": {
      "key": "-NtestLead1",
      "versionKey": "-NrandomKey1",
      "affiliateKey": "-NaffiliateKey1",
      "affiliateCode": "AHM1",
      "fullName": "خالد محمود",
      "email": "khaled.test@example.com",
      "phone": "+201224445566",
      "country": "مصر",
      "city": "القاهرة",
      "step": 2,
      "consent": true,
      "answers": {
        "experienceLevel": "beginner",
        "readyAmount": "<200",
        "readyIn24h": "yes",
        "location": "مصر، القاهرة",
        "triedElev8Before": "no",
        "mainGoal": "learn_trading"
      },
      "createdAt": "2025-03-01T18:32:00Z",
      "completedAt": "2025-03-01T18:40:00Z"
    }
  }
}
