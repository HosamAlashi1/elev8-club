# دليل GoHighLevel من الصفر

> آخر تحديث للتحقق من المعلومات والأسعار: 30 أغسطس 2026.  
> هذا الملف مكتوب لشخص يسمع عن GoHighLevel لأول مرة، وليس كدعاية للمنصة.

## الخلاصة في دقيقة

GoHighLevel، ويُختصر غالبًا إلى **GHL** أو **HighLevel**، هو منصة تجمع أدوات كانت الشركات عادة تشتريها وتربطها منفصلة:

- CRM لحفظ العملاء المحتملين ومتابعة مراحل البيع.
- أتمتة للرسائل والمهام والمتابعة.
- Email وSMS وWhatsApp ومحادثات في صندوق موحّد.
- صفحات هبوط، نماذج، استبيانات وحجوزات.
- مدفوعات، منتجات واشتراكات عبر بوابات مثل Stripe.
- كورسات، memberships وكوميونيتي.
- Affiliate Manager لتتبع المسوقين والعمولات.
- Social Planner لجدولة ونشر المحتوى.
- تقارير وصلاحيات للمستخدمين.

بمعنى بسيط: **هو نظام تشغيل للمبيعات والتسويق وخدمة العملاء، وليس مجرد CRM**.

لكنه ليس عصًا سحرية. شراء الاشتراك لا يعني أن كل شيء سيعمل وحده؛ يجب إعداد الـpipelines والـworkflows والقوالب والصلاحيات وربط الدومين والدفع وWhatsApp، ثم اختبار رحلة العميل كاملة.

## تشبيه سريع

تخيّل أن العمل اليوم موزع بين:

- ملف عملاء.
- موظفي مبيعات.
- WhatsApp.
- SendGrid أو أداة Email.
- موقع وصفحات تسجيل.
- نظام اشتراكات.
- كوميونيتي.
- تقارير.

GoHighLevel يحاول وضع هذه الأشياء في مبنى واحد. قد نبقي واجهة موقعنا الخاصة كباب المبنى، لكن العمليات الداخلية تتم داخله.

## المصطلحات التي ستسمعها

### Agency

الحساب الرئيسي الذي يدير حسابات الأعمال. إذا كنا وكالة تدير عدة عملاء، يكون لكل عميل حساب فرعي.

### Sub-account أو Location

بيئة العمل الخاصة بشركة واحدة: جهات اتصالها، موظفوها، رسائلها، أتمتتها ومنتجاتها. في حالة Elev8 غالبًا نحتاج Location واحدة في البداية.

### Contact

الشخص المسجل: اسمه، هاتفه، بريده، مصدره، tags، custom fields، الموافقات وأي معلومات إضافية.

### Opportunity وPipeline

الـContact هو الشخص، أما الـOpportunity فهي صفقة البيع الخاصة به. الـPipeline هو لوحة المراحل، مثل:

`New → Pre-meeting → Post-meeting → Follow-up → Won/Lost`

### Workflow

قواعد آلية تعمل عند وقوع حدث. مثال:

1. شخص يملأ النموذج.
2. يُنشأ Contact.
3. يُضاف إلى Pipeline.
4. يُسند إلى موظف.
5. تصله رسالة Email أو WhatsApp.
6. إذا لم يرد بعد يومين، يُنشأ follow-up task.

### Conversations

صندوق محادثات يجمع القنوات المدعومة ليتابع الفريق الرسائل من مكان واحد.

### Custom Fields وTags

- Custom Fields: بيانات ثابتة مثل الدخل، الخبرة، الباقة أو كود الـaffiliate.
- Tags: علامات تساعد في التقسيم والتشغيل، مثل `qualified` أو `needs-follow-up`.

### Webhook وAPI

- API: موقعنا يرسل أو يقرأ بيانات من HighLevel برمجيًا.
- Webhook: HighLevel يخبر نظامنا فور حدوث حدث، مثل دفع ناجح أو تغيير مرحلة صفقة.

## كيف تبدو رحلة عميل كاملة؟

سيناريو مناسب لـElev8:

1. الزائر يدخل Landing Page المصممة بـAngular.
2. يسجل اسمه وهاتفه وبريده ويجيب عن الأسئلة.
3. الواجهة ترسل البيانات إلى backend آمن.
4. الـbackend ينشئ أو يحدّث Contact في HighLevel.
5. ينشئ Opportunity في مرحلة `New` ويضع الإجابات في Custom Fields.
6. Workflow يسند الـlead لموظف ويبلغه.
7. Workflow يرسل رسالة ترحيب مصرحًا بها.
8. الموظف يحرك الصفقة خلال Pipeline.
9. العميل يدفع من checkout أو payment link.
10. الدفع الناجح يفعّل membership أو community access.
11. قبل التجديد تعمل رسائل وتذكيرات تلقائية.
12. الإلغاء أو فشل الدفع يغيّر الحالة ويبدأ مسار استرجاع العميل.

هذه الرحلة ممكنة، لكن يلزم إثبات كل خطوة في تجربة فعلية قبل إلغاء النظام الحالي.

## شرح المكونات المهمة

### 1. CRM والمبيعات

يوفر HighLevel Contacts وOpportunities وPipelines ومهام وملاحظات ومستخدمين. فائدته أن فريق المبيعات يرى من هو العميل، من المسؤول عنه، أين وصل، وما الرسائل والمواعيد المرتبطة به.

يمكن أن يحل محل جزء كبير من لوحة Leads الحالية، بشرط أن تتطابق مراحلنا وصلاحياتنا وتقاريرنا مع ما توفره المنصة.

### 2. Email Marketing

يوجد نظام إرسال مدمج اسمه LC Email، مع campaigns وworkflows وdedicated sending domains. يجب إعداد subdomain للإرسال وتدفئته تدريجيًا؛ وجود الأداة لا يضمن وصول الرسائل إلى Inbox.

السعر الرسمي المنشور حاليًا هو **0.675$ لكل 1000 Email**، والتحقق من العناوين **2.50$ لكل 1000 verification**. الـDedicated IP اختياري وسعره المنشور **59$ شهريًا**، وغالبًا لا نحتاجه في البداية.

### 3. WhatsApp

يدعم HighLevel ربط WhatsApp Business، المحادثات، bulk actions، templates وworkflows.

هناك فرق جوهري:

- **WhatsApp Marketing داخل HighLevel:** رسائل فردية للعملاء عبر WhatsApp Business Platform.
- **WhatsApp Groups في نظامنا:** فتح رابط مجموعة وتوزيع الناس على مجموعات حسب السعة.

هما ليسا الشيء نفسه. خارج نافذة خدمة العميل ذات 24 ساعة، تحتاج الرسالة التي يبدأها العمل إلى template معتمد، وتختلف تكلفتها حسب البلد والتصنيف. الاشتراك المنشور هو **10$ شهريًا لكل Location مفعّل**، إضافةً إلى تكلفة الرسائل المدفوعة.

إذا نقلنا المجتمع إلى HighLevel Communities يمكن التخلص لاحقًا من مجموعات WhatsApp. إذا بقيت المجموعات، نحتاج إبقاء أو إعادة تنفيذ منطق توزيع الروابط.

### 4. Communities والكورسات

يمكن إنشاء كوميونيتي باسم وهوية ودومين مخصص، وإدارة الأعضاء والمجموعات والمنشورات. توجد courses وpaid courses وخيارات one-time أو recurring بحسب الإعداد وبوابة الدفع المدعومة.

هذا قد يوفر علينا بناء member portal وكورسات وكوميونيتي من الصفر. لكن تجربة المستخدم ستكون تجربة HighLevel المخصصة بالـbranding المتاح، وليست حرية تصميم Angular كاملة.

### 5. Payments والاشتراكات

تدعم المنصة products، checkouts، payment links، transactions وsubscriptions عبر مزودي دفع مدعومين، ومنهم Stripe في مساحات متعددة.

قبل الاعتماد عليها يجب التحقق من:

- توفر بوابة الدفع في دولة الشركة القانونية.
- العملات ووسائل الدفع المطلوبة.
- recurring payments وtrial وcoupon.
- failed payment، cancellation، refund وchargeback.
- متى يدخل العميل الكوميونيتي ومتى يُمنع منها.
- رسوم بوابة الدفع، فهي منفصلة عن اشتراك HighLevel.

يفضل استخدام checkout مستضاف في البداية بدل بناء شاشة بطاقات مخصصة.

### 6. Affiliate Manager

يستطيع HighLevel إنشاء حملات وروابط affiliate وتتبع leads والمبيعات والعمولات، مع payouts يدوية أو خيارات آلية مدعومة.

لا نفترض أنه يطابق نظامنا تلقائيًا. يجب اختبار:

- attribution عند وجود أكثر من رابط أو جهاز.
- مدة الـcookie أو tracking window.
- العمولات المتكررة للتجديد.
- الإلغاء والاسترجاع والـchargeback.
- نقل lead بين affiliate وآخر.
- التقارير التي يراها الـaffiliate.

تنبيه من وثائق HighLevel: تتبع refunds في Affiliate Manager ليس تلقائيًا في جميع حالات المنتجات والاشتراكات، ولذلك يجب اختبار قواعدنا المالية بدقة.

### 7. Social Planner

هو تقويم مركزي لإنشاء وجدولة ونشر ومتابعة المحتوى على شبكات مدعومة مثل Facebook وInstagram وThreads وGoogle Business Profile وLinkedIn وTikTok وYouTube وPinterest وغيرها.

هو مفيد للإدارة اليومية، لكنه لا يعني بالضرورة استبدال كل أداة أصلية للمنصة: أنواع المنشورات والتحليلات والصلاحيات تختلف من شبكة لأخرى، وإدارة الإعلانات أو الرسائل أو التعليقات المتقدمة موضوع منفصل.

### 8. API والواجهة الخاصة بنا

يمكن للواجهة الخاصة بنا إنشاء Contacts والتعامل مع Opportunities وقراءة Payments/Subscriptions والاستماع إلى Webhooks، وتوجد APIs لمساحات أخرى كذلك.

لكن التصميم الصحيح هو:

```text
Angular UI
   ↓
Backend / Firebase Cloud Functions
   ↓
HighLevel API
   ↕
HighLevel Webhooks
```

لا يجوز وضع access token أو private integration token داخل Angular؛ أي مستخدم يستطيع استخراجه من المتصفح.

وجود API لا يعني أن كل زر داخل HighLevel له endpoint عام بنفس المرونة. لذلك نعمل قائمة endpoints مطلوبة ونختبرها على الخطة المختارة قبل توقيع قرار migration كامل.

## ما الذي ليس GoHighLevel؟

- ليس كودًا نملكه ونشغله أينما نريد.
- ليس قاعدة بيانات حرة مثل Firebase يمكن تشكيلها بأي نموذج دون قيود.
- ليس ضمانًا لوصول Email أو قبول WhatsApp templates.
- ليس بديلًا مباشرًا عن WhatsApp Groups.
- ليس واجهة custom pixel-perfect بالكامل.
- ليس مجانيًا بعد دفع الاشتراك؛ توجد رسوم استخدام وإضافات وبوابة دفع.
- لا يلغي الحاجة إلى شخص يفهم العملية ويضبط الأتمتة ويراقبها.

## الأسعار الأساسية الحالية

الأسعار التالية بالدولار وشهرية وفق صفحات HighLevel الرسمية وقت كتابة الملف، وقد تتغير:

| الخطة | السعر | الصورة المبسطة |
|---|---:|---|
| Starter | 97$ | بداية مناسبة للتجربة وحتى 3 sub-accounts حسب الوثائق الحالية |
| Unlimited / Freelancer | 297$ | حسابات فرعية غير محدودة وwhite-label desktop ومزايا أوسع |
| Agency Pro | 497$ | SaaS Mode وadvanced API/rebilling وتقارير وقدرات وكالة متقدمة |

تكاليف محتملة فوق الاشتراك:

| البند | السعر الرسمي المنشور حاليًا |
|---|---:|
| WhatsApp | 10$/شهر لكل Location + تكلفة الرسائل حسب البلد والنوع |
| LC Email | 0.675$ لكل 1000 Email |
| Email validation | 2.50$ لكل 1000 عنوان |
| Dedicated IP اختياري | 59$/شهر |
| Branded client portal app اختياري | 49$/شهر لكل Location مفعّل |
| AI Growth اختياري | 50$/شهر لكل Location |
| AI Unlimited اختياري | 97$/شهر لكل Location |
| Premium workflow actions | 0.01$ للتنفيذ، أو خطط volume اختيارية |
| Stripe/بوابة الدفع | رسوم المزود منفصلة حسب الدولة والوسيلة |

**الرقم الأدنى الواقعي لتجربة Business واحدة** قد يبدأ من نحو `97$ + 10$ WhatsApp + الاستخدام`، لكن إذا احتجنا membership/white-label/advanced API فقد تصبح الخطة `297$` أو `497$`. لا نعتمد الخطة قبل اختبار المزايا المطلوبة داخل trial أو حساب فعلي.

## المزايا والعيوب بصدق

### المزايا

- إطلاق أسرع بدل بناء كل أداة.
- مكان واحد للفريق والبيانات والمحادثات.
- أتمتة جاهزة ومرئية.
- صيانة أقل لخصائص CRM العامة.
- مزايا جديدة تصل من المزود دون أن نبرمجها.
- تقليل عدد الخدمات المتفرقة والتكاملات بينها.

### العيوب

- اشتراك وتكاليف استخدام مستمرة.
- Vendor lock-in وصعوبة العودة إذا بنينا كل العملية داخله.
- مرونة أقل من نظام نملكه بالكامل.
- تغير الواجهة أو الأسعار أو الحدود بقرار المزود.
- بعض المزايا تحتاج خطة أعلى أو add-on.
- migration وتنظيف البيانات والأتمتة يحتاجان عملًا حقيقيًا.
- أي انقطاع أو تقييد من المزود يؤثر في عدة أجزاء معًا.

## أسئلة يجب إجبار البائع أو العميل على إجابتها

قبل قول “نرفع كل شيء عليه”، نطلب demo عمليًا لهذه الحالات:

1. ما الخطة الدقيقة المطلوبة لكل ميزة نريدها؟
2. هل private API endpoints المطلوبة تعمل على هذه الخطة؟
3. هل الدولة القانونية وبوابة الدفع والعملات مدعومة؟
4. هل رقم WhatsApp الحالي يمكن نقله؟ وما الذي يحدث للتاريخ والقوالب؟
5. هل WhatsApp Groups مطلوبة أم يمكن استبدالها بـCommunity؟
6. كيف يُحسب affiliate عند التجديد والإلغاء والاسترجاع؟
7. هل يمكن تصدير Contacts وOpportunities والمحادثات والمدفوعات عند المغادرة؟
8. ما حدود المستخدمين والإرسال والـworkflows والـAPI؟
9. ما تجربة العضو على الهاتف والعربية وRTL؟
10. من يملك حساب Agency وStripe وMeta Business والدومينات؟
11. ما سياسة النسخ الاحتياطي والاسترجاع؟
12. ما التكلفة الشهرية المتوقعة على حجمنا الحقيقي، لا على مثال تسويقي؟

## متى يكون قرارًا ممتازًا؟

يكون ممتازًا عندما يقبل العميل استخدام Dashboard HighLevel، وتكون عملياته قريبة من CRM وpipelines وworkflows القياسية، ويريد سرعة إطلاق أكثر من حرية برمجية كاملة.

## متى لا يكون مناسبًا؟

لا يكون مناسبًا كبديل كامل عندما يطلب العميل واجهات داخلية مخصصة جدًا، أو منطق بيانات معقدًا لا يناسب الـcustom fields/objects، أو يريد امتلاك وتشغيل كل شيء بنفسه، أو لا تتوفر بوابة الدفع وWhatsApp في وضعه القانوني.

## مصادر رسمية

- [HighLevel API Documentation](https://marketplace.gohighlevel.com/docs/)
- [HighLevel plans and billing](https://help.gohighlevel.com/support/solutions/articles/155000001156-highlevel-pricing-guide)
- [Agency plan comparison](https://help.gohighlevel.com/support/solutions/articles/48001208376-billing-related-questions-for-agencies)
- [WhatsApp pricing](https://help.gohighlevel.com/support/solutions/articles/155000001428-whatsapp-pricing-billing-and-rebilling-guide)
- [LC Email pricing](https://help.gohighlevel.com/support/solutions/articles/48001220605)
- [Communities setup](https://help.gohighlevel.com/support/solutions/articles/155000000280-how-to-setup-customize-and-manage-your-communities)
- [Paid courses in Communities](https://help.gohighlevel.com/support/solutions/articles/155000002135)
- [Social Planner setup](https://help.gohighlevel.com/support/solutions/articles/155000005063)
- [Affiliate Manager](https://help.gohighlevel.com/support/solutions/articles/155000003637-how-does-the-affiliate-manager-work-)
- [Stripe setup](https://help.gohighlevel.com/support/solutions/articles/155000005073)

