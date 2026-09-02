# مقارنة GoHighLevel مع نظام Elev8 الحالي

> آخر تحديث: 30 أغسطس 2026.  
> الهدف: قرار تجاري وتقني مفهوم، وليس إثبات أن النظام الحالي أو GoHighLevel أفضل في كل شيء.

## القرار المختصر جدًا

**لا أنصح بحذف نظام Elev8 الحالي والبدء من الصفر على GoHighLevel فورًا.**  
**ولا أنصح بالاستمرار في بناء CRM وكوميونيتي وتسويق كامل من الصفر إذا كانت قدرات HighLevel مناسبة.**

التوصية الأفضل هي **Hybrid**:

- نبقي Angular للواجهة والهوية والـfunnel والأسئلة.
- نجعل HighLevel مصدر التشغيل للـCRM وPipeline والـEmail وWhatsApp marketing والأتمتة، ثم الكوميونيتي والاشتراكات إذا نجح الاختبار.
- يستخدم الموظفون Dashboard HighLevel بدل أن نبني لهم كل شاشة مرة أخرى.
- نبقي Firebase مؤقتًا كطبقة تكامل وللمنطق الخاص، خصوصًا WhatsApp Groups والتجديدات، ثم نحذف فقط ما ثبت أن HighLevel استبدله بالكامل.

## ماذا يوجد في Elev8 اليوم؟

فحص SocratiCode للمشروع أظهر أن النظام الحالي يحتوي على:

### واجهة وتسويق

- Angular landing pages وتجربة مرئية مخصصة.
- تسجيل أولي ثم questionnaire متعدد الأسئلة.
- Google Tag Manager وأحداث conversion/e-commerce.
- Affiliate referral codes وروابط خاصة.

### CRM داخلي

- Leads مع حالات `new / pre_meeting / post_meeting / follow_up / closed / not_interested`.
- أربع صلاحيات: `admin / sales / account_manager / affiliate`.
- Dashboard وأرقام وتقارير حسب الدور.
- تعيين موظف مبيعات أو account manager.
- فلاتر وبحث وCSV/Excel exports.

### منطق خاص بالعمل

- ثلاثة packages: `starter / pro / ai` داخل دورة البيع الحالية.
- Renewal cycles وحالات `renewal_followup / renew_later / renewed / not_renewed`.
- Call logs وحد أقصى للمكالمات في بعض تدفقات التجديد.
- إظهار بيانات مختلفة للـaffiliate والموظف والمدير.

### WhatsApp

- حتى 10 مجموعات في الإعدادات الحالية.
- سعة معرفة في النظام مقدارها 1000 لكل مجموعة.
- اختيار المجموعة التالية حسب الترتيب والسعة.
- زيادة counter وحفظ المجموعة والوقت وطريقة الإسناد على الـlead.
- فتح رابط المجموعة للعميل بعد إكمال التسجيل.

### Email والبنية التحتية

- Firebase Authentication وRealtime Database وHosting وCloud Functions.
- SendGrid bulk email من Cloud Functions.
- قواعد صلاحيات Firebase وعمليات إنشاء وإدارة مستخدمي الداشبورد.

الخدمة المركزية `FirebaseService` مرتبطة مباشرة بـ16 مكوّنًا/شاشة، لذلك نزعها ليس تعديلًا صغيرًا؛ إنه migration للنظام.

## المقارنة الوظيفية

| المجال | Elev8 الحالي | GoHighLevel | الحكم |
|---|---|---|---|
| Landing page والهوية | تصميم Angular مخصص بالكامل | Funnel/website builder مع قيود | نبقي Angular |
| Questionnaire | مخصص ويدعم منطق وتجربة خاصة | Forms/Surveys/Custom fields | يمكن الربط، ولا ضرورة لتغيير الواجهة |
| Contacts/Leads | Firebase model مخصص | CRM Contacts ناضج | GHL أفضل للعمليات العامة |
| مراحل البيع | حالات وشاشات مبرمجة | Opportunities/Pipelines جاهزة | GHL غالبًا أفضل |
| صلاحيات الفريق | أربع صلاحيات مخصصة | Users/roles/permissions | نعمل permission matrix قبل القرار |
| تعيين leads | منطق مخصص | Users + workflows + assignment | قابل للاستبدال بعد PoC |
| Renewal workflow | cycles وcall logs مخصصة | Pipelines/workflows/subscriptions/tasks | يمكن تقريبها، لكن التطابق يحتاج اختبارًا |
| Email campaigns | SendGrid + شاشة مخصصة | LC Email + campaigns/workflows | GHL أوفر في التشغيل والإدارة |
| WhatsApp marketing | غير موجود كمنصة رسائل كاملة | Templates/conversations/workflows | GHL أفضل بوضوح |
| WhatsApp Groups | توزيع روابط حسب السعة | ليس نفس WhatsApp marketing | نبقي منطقنا أو نستبدل المجتمع كله |
| Community | لا توجد منصة community مكتملة في الكود الحالي | Communities جاهزة | GHL يوفر بناءً كبيرًا |
| Courses/Membership | ليست منظومة مكتملة حاليًا | Courses/Paid courses/Access | GHL يوفر بناءً كبيرًا |
| Subscription/checkout | توجد حزم ومراجع Stripe، لكن ليس تدفق اشتراك مكتمل ظاهر | Products/checkouts/subscriptions | GHL مناسب بعد اختبار payment provider |
| Affiliates | روابط، attribution، dashboards وإحصاءات مخصصة | Affiliate Manager وcommissions/payouts | نختبر قواعد التجديد والrefund قبل النقل |
| Social media | روابط/عرض فقط، لا إدارة فعلية | Social Planner | GHL إضافة حقيقية |
| تقارير خاصة | حرية كاملة لأن الكود لنا | تقارير جاهزة وcustomization محدود | حسب متطلبات الإدارة |
| Excel export | موجود ومخصص | توجد exports وتقارير | لا نحذف الحالي قبل مقارنة المخرجات |
| ملكية البيانات والمنطق | أعلى؛ الكود وFirebase تحت سيطرتنا | اعتماد أكبر على vendor | Elev8 أفضل للسيطرة |
| سرعة إضافة feature قياسية | تحتاج تطويرًا واختبارًا | غالبًا إعداد لا برمجة | GHL أسرع |
| حرية التصميم | كاملة | محدودة بقدرات المنصة | Elev8 أفضل |

## الفجوات التي قد يختصرها HighLevel فعلًا

يمكن أن يوفر علينا بناء وصيانة:

- صندوق محادثات موحد.
- WhatsApp Business marketing وقوالبه.
- Email campaigns وdrip sequences.
- Pipeline UI ومهام المبيعات.
- Calendars والحجوزات والتذكيرات.
- Community، courses وmember management.
- Affiliate payouts وتقارير قياسية.
- Social media calendar والنشر.
- عدد كبير من integrations وwebhooks الجاهزة.

هذه هي القيمة الحقيقية، وليست مجرد تخزين Contact بدل Firebase lead.

## الأشياء التي لا يجوز أن نرميها مباشرة

### 1. Angular funnel

هو جزء من الهوية وتجربة التحويل، ولدينا فيه أسئلة وvalidation وtracking. لا توجد فائدة مؤكدة من إعادة بنائه داخل page builder الآن.

### 2. منطق WhatsApp Groups

HighLevel WhatsApp يرسل رسائل فردية؛ نظامنا يوزع روابط مجموعات حسب السعة. إما أن نبقي هذا الجزء، أو نتخذ قرارًا تجاريًا بنقل المجتمع من WhatsApp إلى HighLevel Community.

### 3. Renewal cycles وCall logs

يمكن تمثيلها في pipelines/tasks/workflows، لكن يجب إثبات أن الفريق يحصل على التاريخ والحدود والتقارير نفسها.

### 4. Affiliate attribution الحالي

نحتاج فترة تشغيل متوازٍ لمقارنة attribution، خصوصًا التجديد، الإلغاء، refund وعودة العميل من جهاز مختلف.

### 5. Firebase كطبقة آمنة

في المرحلة الأولى تبقى Cloud Functions وسيطًا آمنًا للـAPI وWebhooks. لا نضع مفاتيح HighLevel في Angular.

## مقارنة التكلفة

### أولًا: تكلفة Elev8 الحالية

لا توجد داخل المستودع فواتير أو usage حقيقي، لذلك أي رقم ثابت سيكون اختراعًا. المعادلة الصحيحة هي:

```text
Firebase Hosting + Realtime Database + Functions
+ SendGrid plan/usage
+ domain/media/storage إن وجدت
+ ساعات التطوير والصيانة والدعم
```

Firebase قد يبدأ ضمن المجاني للاستخدام الصغير. الوثائق الحالية تعطي Realtime Database على Spark حتى 1GB storage و10GB downloads شهريًا دون تكلفة؛ على Blaze يبقى هذا الحد المجاني ثم يصبح التخزين المنشور 5$/GB-month إضافةً إلى network والخدمات الأخرى. التكلفة التقنية المباشرة قد تكون منخفضة، لكن **أكبر تكلفة فعلية هي وقت بناء وصيانة كل feature**.

يجب استخراج آخر 3 فواتير من Firebase وSendGrid قبل عرض مقارنة مالية نهائية.

### ثانيًا: تكلفة GoHighLevel المنشورة

| البند | شهريًا |
|---|---:|
| Starter | 97$ |
| Unlimited/Freelancer | 297$ |
| Agency Pro | 497$ |
| WhatsApp لكل Location | 10$ + استخدام الرسائل |
| Email | 0.675$ لكل 1000 رسالة |
| Email validation اختياري | 2.50$ لكل 1000 |
| Dedicated IP اختياري | 59$ |
| Branded portal app اختياري | 49$ لكل Location |
| AI اختياري | 50$ Growth أو 97$ Unlimited لكل Location |
| Premium workflow actions | 0.01$ للتنفيذ أو volume plan |
| Stripe/payment gateway | رسوم مستقلة حسب المزود والدولة |

### سيناريوهات تقريبية

الأرقام التالية **ليست عرض سعر**؛ هي baseline قبل الرسائل المدفوعة ورسوم Stripe:

| السيناريو | الأساس الشهري التقريبي | متى يناسب؟ |
|---|---:|---|
| PoC بسيط على Starter + WhatsApp | 107$ + usage | اختبار CRM وWhatsApp والـworkflows |
| تشغيل على Unlimited + WhatsApp | 307$ + usage | إذا احتجنا ميزات الخطة وwhite-label/memberships/عدة حسابات |
| Agency Pro + WhatsApp | 507$ + usage | إذا احتجنا SaaS Mode أو advanced API/rebilling المتقدم |
| Unlimited + WhatsApp + branded app + dedicated IP | 415$ + usage | سيناريو branding وإرسال أكبر، وليس البداية المقترحة |

لا نشتري Dedicated IP أو AI أو branded app في البداية إلا إذا أثبتنا الحاجة.

### تكلفة الانتقال لمرة واحدة

حتى عند استخدام GHL يوجد عمل تنفيذ:

- تصميم حقول وpipelines وصلاحيات.
- إعداد workflows والقوالب والدومينات.
- ربط Angular وCloud Functions بالـAPI.
- استقبال webhooks ومنع التكرار.
- نقل وتنظيف contacts والبيانات.
- إعداد Stripe وMeta WhatsApp والتحقق.
- اختبار renewal، affiliate، payment failure وunsubscribe.
- تدريب الفريق وكتابة إجراءات التشغيل.

تقدير أولي معقول للـPoC والانتقال المرحلي هو **2–4 أسابيع عمل**، ويتغير حسب جودة البيانات، جاهزية حسابات Meta/Stripe، وعدد الأتمتات. Full migration غير المنضبط قد يأخذ أكثر.

## مقارنة الخيارات الثلاثة

| الخيار | الميزة | الخطر | التقييم |
|---|---|---|---|
| نبقى على Elev8 فقط | ملكية ومرونة وتكلفة hosting منخفضة | نستمر ببناء وصيانة CRM/marketing/community بأنفسنا | غير مفضل إذا توسعت المتطلبات |
| ننتقل بالكامل فورًا إلى GHL | توحيد سريع ظاهريًا | فقد منطق خاص، migration كبير، lock-in ومفاجآت plan/API | غير مفضل الآن |
| Hybrid تدريجي | نحافظ على الواجهة والمنطق المهم ونستخدم GHL في نقاط قوته | تكامل مؤقت بين نظامين يحتاج انضباطًا | **الخيار الموصى به** |

## الشكل المعماري الموصى به

```text
العميل
  ↓
Angular Landing + Questionnaire
  ↓
Firebase Cloud Functions / Integration Layer
  ├── يحفظ حالة مؤقتة أو منطقًا خاصًا عند الحاجة
  ├── يرسل Contacts/Opportunities إلى HighLevel
  └── يستقبل HighLevel Webhooks بأمان
               ↓
HighLevel
  ├── CRM + Pipelines
  ├── Email + WhatsApp
  ├── Workflows + Tasks
  ├── Payments + Subscriptions
  ├── Affiliate Manager
  ├── Community + Courses
  └── Social Planner
```

## خطة قرار وتنفيذ بدون مقامرة

### المرحلة 0: معلومات وفواتير

- استخراج فواتير Firebase وSendGrid لآخر 3 أشهر.
- تحديد حجم leads وEmails وWhatsApp شهريًا.
- تثبيت الدولة القانونية، العملة وبوابة الدفع.
- تحديد هل الهدف WhatsApp marketing أم WhatsApp Groups أم كلاهما.

### المرحلة 1: Proof of Concept

- إنشاء Location تجريبية.
- إنشاء custom fields تطابق Lead وQuestionnaire.
- إنشاء Pipeline تطابق حالات البيع.
- ربط تسجيل واحد من Angular عبر backend.
- Workflow تعيين + Email + WhatsApp test.
- اختبار API وwebhook على الخطة المرشحة.

**شرط النجاح:** لا بيانات مكررة، التعيين صحيح، consent محفوظ، والموظف يستطيع إتمام المتابعة من GHL.

### المرحلة 2: تجربة فريق محدودة

- تشغيل عدد محدود من leads بالتوازي في Firebase وGHL.
- مقارنة الحالات، attribution والتقارير يوميًا.
- تدريب مدير وموظف مبيعات.
- عدم حذف أي شاشة حالية.

### المرحلة 3: الدفع والكوميونيتي

- اختبار دفع حقيقي منخفض القيمة ثم refund.
- اختبار recurring، failed payment وcancellation.
- تفعيل/إلغاء membership تلقائيًا.
- اختبار العربية والموبايل وتجربة العضو.

### المرحلة 4: Affiliate والتجديد

- اختبار affiliate من النقر حتى التجديد والدفع.
- مقارنة commission وrefund/cancellation.
- تحويل renewal workflow فقط إذا تطابق السلوك المطلوب.

### المرحلة 5: الإيقاف التدريجي

- نوقف كتابة البيانات في الشاشة التي استُبدلت فقط.
- نحتفظ بتصدير ونسخة احتياطية وخطة rollback.
- نحذف الكود القديم لاحقًا، لا في يوم الإطلاق.

## معايير Go / No-Go

نقول **Go** إذا:

- الـAPI والـwebhooks المطلوبة تعمل على خطة مقبولة السعر.
- Stripe/بوابة الدفع وWhatsApp متاحان قانونيًا وعمليًا.
- الفريق يقبل استخدام Dashboard HighLevel.
- Pipeline والتجديد والـaffiliate يحققون المتطلبات الأساسية.
- Community تقدم تجربة عربية وموبايل مقبولة.
- التكلفة الكلية أقل من تكلفة التطوير والصيانة المتوقعة.

نقول **No-Go أو Hybrid محدود** إذا:

- العميل يريد custom dashboard مطابقًا بالكامل فوق GHL.
- يلزم advanced API بخطة لا تبررها قيمة المشروع.
- قواعد affiliate/renewal لا يمكن تمثيلها بأمان.
- WhatsApp Groups جزء أساسي ولا يريد نقل المجتمع.
- بوابة الدفع أو الكيان القانوني غير مدعوم.
- لا توجد طريقة تصدير وrollback مقبولة.

## أسئلة مباشرة للعميل تمنع الكلام العام

بدل عبارة “GoHighLevel يعمل كل شيء”، نطلب منه الإجابة أو عرض demo لهذه النقاط:

1. ما الخطة التي يقترحها ولماذا؟
2. هل يريدنا Agency أم Sub-account داخل Agency يملكها طرف آخر؟
3. من يملك البيانات وحساب Stripe وMeta والدومين؟
4. هل سنستخدم Dashboard GHL أم يريد custom dashboard؟
5. هل المجتمع سيغادر WhatsApp Groups؟
6. اعرض رحلة: lead → assignment → sale → recurring renewal → cancellation.
7. اعرض affiliate sale ثم refund وكيف تتعدل العمولة.
8. اعرض API endpoint وwebhook لكل عملية يريدها من واجهتنا.
9. ما الفاتورة الشهرية المتوقعة على أرقام استخدامنا؟
10. كيف نستخرج كامل البيانات إذا قررنا المغادرة؟

إذا لم يستطع تقديم ذلك، فالكلام تصور تسويقي وليس خطة تنفيذ.

## ملخص جاهز ترسله للعميل

> راجعنا GoHighLevel تقنيًا وقارناه بالنظام الحالي. المنصة تستطيع اختصار جزء كبير من CRM، الـpipelines، Email، WhatsApp marketing، subscriptions، affiliates، community وsocial scheduling. لكن نظامنا الحالي يحتوي منطقًا مخصصًا، أهمه الـquestionnaire، صلاحيات الفريق، التجديدات، attribution وتوزيع WhatsApp Groups حسب السعة. لذلك الحل الأفضل ليس حذف كل شيء، بل إبقاء واجهة Angular وربطها عبر backend آمن مع GoHighLevel، واستخدام Dashboard GoHighLevel للعمليات الداخلية. نبدأ PoC يثبت رحلة lead والدفع والتجديد والaffiliate والـwebhooks، ثم ننقل كل جزء نجح ونبقي ما لا يغطيه النظام. التكلفة الأساسية تتراوح غالبًا بين 107$ و507$ شهريًا قبل الاستخدام ورسوم الدفع حسب الخطة، ولذلك يجب تحديد الخطة والـAPI المطلوبة عمليًا قبل الالتزام.

## ملخص شخصي لك

- العميل معه حق أن GHL يوفر علينا شغلًا كثيرًا.
- ليس معه حق إذا قصد أن الاشتراك يلغي البرمجة والإعداد والهجرة بالكامل.
- الربح الأكبر يحصل عندما يستخدم فريقه Dashboard GHL.
- إذا أصر على custom dashboard لكل شيء، ترتفع التكلفة ويقل سبب استخدام GHL.
- لا تحذف Firebase الآن؛ استخدمه جسرًا ثم خففه تدريجيًا.
- لا تعده بسعر 97$ فقط؛ اذكر الخطة + WhatsApp + Email + الرسائل + Stripe + الإضافات.
- اطلب demo للحالات العشر السابقة، وليس قائمة features.
- القرار المقترح: **PoC ثم Hybrid migration، وليس Full rewrite**.

## أدلة من المشروع

- نموذج الحالات والتجديد والحزم: `src/app/core/models/lead.model.ts`
- الخدمة المركزية للبيانات والتعيين والتجديد: `src/app/modules/services/firebase.service.ts`
- التقاط الأسئلة وتوزيع WhatsApp Groups: `src/app/modules/landingPage/pages/video-questions/sections/question-form/question-form-section.component.ts`
- Dashboard حسب الدور: `src/app/modules/dash/pages/dashboard/dashboard.component.ts`
- تفاصيل دورة المبيعات: `src/app/modules/dash/pages/leads/lead-detail/lead-detail.component.html`
- حملات SendGrid: `src/app/modules/dash/pages/settings/email-campaign/email-campaign.component.ts`
- Cloud Functions: `functions/src/index.ts`
- إعداد Firebase Hosting/Database/Functions: `firebase.json`

## مصادر الأسعار والقدرات

- [HighLevel pricing and billing](https://help.gohighlevel.com/support/solutions/articles/155000001156-highlevel-pricing-guide)
- [HighLevel API](https://marketplace.gohighlevel.com/docs/)
- [WhatsApp pricing](https://help.gohighlevel.com/support/solutions/articles/155000001428-whatsapp-pricing-billing-and-rebilling-guide)
- [LC Email pricing](https://help.gohighlevel.com/support/solutions/articles/48001220605)
- [Communities](https://help.gohighlevel.com/support/solutions/articles/155000000280-how-to-setup-customize-and-manage-your-communities)
- [Social Planner](https://help.gohighlevel.com/support/solutions/articles/155000005063)
- [Affiliate Manager](https://help.gohighlevel.com/support/solutions/articles/155000003637-how-does-the-affiliate-manager-work-)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Firebase Realtime Database billing](https://firebase.google.com/docs/database/usage/billing)

