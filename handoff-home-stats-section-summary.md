# ملخص تسليم شات: Home Sections Progress

المشروع: `e:\Angular\elev8-club`

هذا الملف هو نقطة تسليم للشات الجديد. الهدف منه أن يعرف كيف نشتغل، ما الذي خلص، وأين نكمل بدون إعادة اكتشاف كل شيء.

## قاعدة أولى

- شغّل SocratiCode في بداية الشات.
- آخر حالة معروفة:
  - Status: `green`
  - File watcher: `active`
  - Indexed chunks تقريبًا: `1122`
- لا تعمل revert/reset لأي تغييرات موجودة.
- ابدأ دائمًا من الملفات والـ CSS الحالي، لا تعيد بناء السكشن من الصفر.
- PowerShell قد يعرض النص العربي كـ mojibake عند `Get-Content`. لا تصلح النص العربي فقط بسبب عرض التيرمنال إذا المتصفح يعرضه صح. عند الشك افحص Unicode أو المتصفح.

## ترتيب السكاشن الحالي في Home

الملف:

`src/app/modules/landingPage/pages/home/home.component.html`

السكاشن المنجزة والمركبة حاليًا:

```html
<app-hero-section [onOpenRegistration]="openPopupFromHero"></app-hero-section>
<app-audience-section></app-audience-section>
<app-resources-guides-section></app-resources-guides-section>
<app-stats-section [onOpenRegistration]="openPopupFromStats"></app-stats-section>
<app-video-testimonials-section [onOpenRegistration]="openPopupFromVideoTestimonials"></app-video-testimonials-section>
<app-screenshots-section></app-screenshots-section>
<app-how-it-works-section [onOpenRegistration]="openPopupFromHowItWorks"></app-how-it-works-section>
<app-learn-section [onOpenRegistration]="openPopupFromLearn"></app-learn-section>
<app-why-free-section [onOpenRegistration]="openPopupFromWhyFree"></app-why-free-section>
```

نقطة البداية للشات الجديد:

```html
<app-why-free-section [onOpenRegistration]="openPopupFromWhyFree"></app-why-free-section>
```

نكمل السكشن التالي بعده. أول سكشن قديم inline بعده حاليًا هو سكشن `trust` داخل `home.component.html`. بعد هذا الموضع ما زالت توجد سكاشن قديمة inline وبها نصوص ظاهرة mojibake في الملف/الترمنال، وغالبًا المطلوب لاحقًا تفكيكها أو استبدالها بسكاشن مستقلة مطابقة للتصميم.

## طريقة الشغل المتبعة

- كل سكشن جديد يتم فصله كمكون Angular مستقل داخل:
  `src/app/modules/landingPage/pages/home/sections/...`
- بعد إنشاء أو تعديل سكشن، يتم تعريفه في:
  `src/app/modules/landingPage/landingPage.module.ts`
- لا نعتمد على React/Anima absolute positioning كما هو للصفحة كاملة، لكن نأخذ منه القياسات والأصول عندما يكون أقرب مرجع بصري.
- الهدف الأساسي هو مطابقة Figma/Anima بصريًا قدر الإمكان، خصوصًا الموبايل.
- لو احتجنا أصول من مشروع React/Anima أو Downloads، ننقلها إلى:
  `src/assets/images/anima-home`
- عند الفيديوهات:
  - لا تجعل السلايدر يعتمد على seek مباشر داخل HLS وقت التنقل.
  - استخدم صور/لقطات مستخرجة من الفيديو للعرض داخل السلايدر.
  - شغّل الفيديو الحقيقي فقط عند الضغط على Play.

## السكشن 1: Stats Section

ملفات مهمة:

- `src/app/modules/landingPage/pages/home/sections/stats/stats-section/stats-section.component.html`
- `src/app/modules/landingPage/pages/home/sections/stats/stats-section/stats-section.component.css`
- `src/app/modules/landingPage/pages/home/sections/stats/stats-section/stats-section.component.ts`

أصول مستخدمة:

- `src/assets/images/anima-home/magicpill-1.png`
- `src/assets/images/anima-home/magicpill-2.png`
- `src/assets/images/anima-home/crown-star.svg`
- `src/assets/images/anima-home/money-bag.svg`
- `src/assets/images/anima-home/global.svg`
- `src/assets/images/anima-home/ellipse-6.svg`
- `src/assets/images/anima-home/ellipse-6-ring.svg`

ما تم:

- فصل السكشن داخل `app-stats-section`.
- يحتوي على:
  - نص علوي تعريفي.
  - إحصائيات: `50K طالب ناجح`، `$600k أرباح`، `مختلف دول العالم`.
  - كبسولة زرقاء رئيسية وصغيرة من Anima.
  - دائرة halo من SVG.
  - أيقونات التاج/المال/العالم داخل boxes.
  - وصف أسفل الكبسولة.
  - CTA glass box وزر `احجز مقعدك مجاناً`.

قرارات الديسكتوب:

- دائرة الـ halo تم تدويرها بـ `rotate(90deg)` حتى جهة الفراغ/التلاشي تكون لتحت بدل اليمين.
- لون الدائرة مصبوغ بفلتر أزرق:

```css
filter: brightness(0) saturate(100%) invert(24%) sepia(99%) saturate(3722%) hue-rotate(220deg) brightness(92%) contrast(106%);
mix-blend-mode: screen;
```

- boxes الأيقونات تستخدم border/background أزرق داكن:

```css
border: 1px solid rgba(48, 86, 163, 0.62);
background:
  linear-gradient(180deg, rgba(14, 32, 74, 0.92) 0%, rgba(10, 23, 55, 0.9) 100%),
  rgba(255, 255, 255, 0.05);
```

- ألوان الذهب:

```css
--gold: #d7a747;
--gold-light: #fdf28e;
```

قرارات الموبايل:

- رجعنا لكود Anima React لأخذ قياسات العناصر الصغيرة بدل التخمين:

```text
C:\Users\Hosam\Downloads\AnimaPackage-React-VXe00 (2)\src\screens\HomeResponsive\sections\BenefitsBreakdownSection\BenefitsBreakdownSection.tsx
```

- قياسات معتمدة تقريبًا:
  - مجموعة الإحصائيات: `309px x 286px`
  - الدائرة: `156px x 156px`
  - الكبسولة الرئيسية: `136px x 154px`
  - الكبسولة الصغيرة: `35px x 47px`
  - أيقونات الموبايل: `40px x 40px`
  - خط أفقي dashed: `22px`
  - خطان قطريان يقاربان `17px`
- كلمة `أرباح` مضبوطة لتكون على يمين ديف الأرباح.
- الموبايل يأخذ نفس لون الدائرة ونفس border/background للأيقونات من الديسكتوب.
- الدائرة في الموبايل لا تأخذ دوران الديسكتوب، عندها override بـ `transform: none`.

لا ترجع تغييرات `stats-section` إلا إذا طلب المستخدم صراحة.

## السكشن 2: Video Testimonials Section

ملفات مهمة:

- `src/app/modules/landingPage/pages/home/sections/video-testimonials/video-testimonials-section/video-testimonials-section.component.html`
- `src/app/modules/landingPage/pages/home/sections/video-testimonials/video-testimonials-section/video-testimonials-section.component.css`
- `src/app/modules/landingPage/pages/home/sections/video-testimonials/video-testimonials-section/video-testimonials-section.component.ts`

أصول مهمة:

- `src/assets/videos/hls_here_1/here_1.m3u8`
- `src/assets/images/anima-home/proof-frame-ansar.jpg`
- `src/assets/images/anima-home/proof-frame-fadi.jpg`
- `src/assets/images/anima-home/proof-frame-haitham.jpg`
- `src/assets/images/anima-home/proof-frame-abubakr.jpg`
- `src/assets/images/anima-home/proof-frame-louis.jpg`
- `src/assets/images/anima-home/proof-frame-amal.jpg`
- `src/assets/images/anima-home/proof-person-1.png`
- `src/assets/images/anima-home/proof-person-2.png`
- `src/assets/images/anima-home/proof-person-3.png`
- `src/assets/images/anima-home/proof-avatar-1.svg`
- `src/assets/images/anima-home/proof-avatar-2.svg`
- `src/assets/images/anima-home/proof-avatar-3.svg`
- `src/assets/images/anima-home/proof-arrow-left.png`
- `src/assets/images/anima-home/proof-arrow-right.png`

ما تم:

- فصل السكشن داخل `app-video-testimonials-section`.
- تصميمه مطابق تقريبًا للصورة المرجعية:
  - عنوان يمين في الديسكتوب.
  - Stack فيديوهات/هواتف يسار.
  - بطاقة الطالب فوق الفيديو.
  - رقم ذهبي مثل `+$1,000`.
  - أزرار أسهم مطابقة من صور PNG.
  - مجموعة avatars مع `+150`.
  - موبايل مضبوط في الوسط بعد إزالة `translateX(-38px)`.

قرارات مهمة جدًا:

- مشكلة التعليق عند التنقل كانت بسبب محاولة عمل seek داخل HLS لكل فيديو/طبقة أثناء السلايدر.
- الحل الحالي:
  - السلايدر يعرض صور JPG مستخرجة من نفس الفيديو، وليس فيديوهات حية.
  - الصور تحمل مسبقًا وتعمل `decode()` داخل TS.
  - الفيديو الحقيقي HLS موجود فقط داخل الـ phone الأمامي ويشتغل عند الضغط على Play.
  - عند الانتقال بين السلايدات يتم إيقاف الفيديو وإلغاء أي pending play.
  - بعد استقرار السلايد، يتم عمل warmup للفيديو النشط في الخلفية:
    - تحميل HLS.
    - startLoad عند `frameTime`.
    - seek إلى لقطة البداية.
    - حفظ `activeVideoReadyKey`.
  - إذا ضغط المستخدم Play والفيديو جاهز، يبدأ سريعًا.
  - إذا ضغط قبل أن يجهز، يظهر loading صغير داخل زر التشغيل بدل أن يبدو وكأنه علق.
  - الضغط على الفيديو مرة يشغله، والضغط مرة ثانية يوقفه.

ملاحظة مهمة:

الفيديو الحالي مؤقت. إذا تغير الفيديو لاحقًا، أعد توليد صور `proof-frame-*.jpg` من الفيديو الجديد أو بدّل مساراتها. لا ترجع السلايدر ليعرض HLS مباشر لكل طبقة.

## السكشن 3: Screenshots Section

ملفات مهمة:

- `src/app/modules/landingPage/pages/home/sections/screenshots/screenshots-section/screenshots-section.component.html`
- `src/app/modules/landingPage/pages/home/sections/screenshots/screenshots-section/screenshots-section.component.css`
- `src/app/modules/landingPage/pages/home/sections/screenshots/screenshots-section/screenshots-section.component.ts`

أصول مهمة:

- `src/assets/images/anima-home/shots-screenshot.png`
- `src/assets/images/anima-home/shots-glow.svg`
- `src/assets/images/anima-home/shots-circle-left.png`
- `src/assets/images/anima-home/shots-circle-right.png`
- `src/assets/images/anima-home/shots-arrow-prev.svg`
- `src/assets/images/anima-home/shots-arrow-next.svg`
- `src/assets/images/anima-home/shots-phones-back.svg`
- `src/assets/images/anima-home/shots-phones-mid.svg`
- `src/assets/images/anima-home/shots-card-fade.svg`

ما تم:

- فصل السكشن داخل `app-screenshots-section`.
- السكشن مركب بعد `app-video-testimonials-section`.
- يحتوي على:
  - عنوان: `عندي حرفيًا مئات الـ screenshots ومئات النتائج`
  - subtitle.
  - coverflow carousel للصور.
  - أسهم تنقل.
  - كروت نصية أسفل السلايدر.
  - glow أزرق وأقواس جانبية.

ملاحظات:

- مصفوفة `slides` في TS تستخدم حاليًا نفس الصورة `shots-screenshot.png` عدة مرات كـ placeholder.
- إذا توفرت screenshots حقيقية، بدّل المصفوفة في:
  `screenshots-section.component.ts`
- السكشن يعتمد تموضع data-offset للـ coverflow:
  - `0` وسط
  - `±1` جوانب
  - `±2` أبعد
  - `±3` buffer مخفي

## السكشن 4: How It Works Section

ملفات مهمة:

- `src/app/modules/landingPage/pages/home/sections/how-it-works/how-it-works-section/how-it-works-section.component.html`
- `src/app/modules/landingPage/pages/home/sections/how-it-works/how-it-works-section/how-it-works-section.component.css`
- `src/app/modules/landingPage/pages/home/sections/how-it-works/how-it-works-section/how-it-works-section.component.ts`

أصول مهمة:

- `src/assets/images/anima-home/shots-arrow-prev.svg`

ما تم:

- فصل السكشن داخل `app-how-it-works-section`.
- السكشن مركب بعد `app-screenshots-section`.
- يحتوي على عنوان `كيف هاي الطريق بتشتغل` و4 خطوات لطريقة التداول.
- يوجد شريط AI أزرق في آخر السكشن مع عنوان `لكن الذكاء الاصطناعي غيّر كل شيء` وبوكس CTA.

ملاحظات تصميمية مهمة:

- الخلفية الزرقاء السفلية هي `hiw-section::after`.
- لا تغيّر `hiw-section::after` عشوائيًا، لأن هذا يخرب الشريط الأزرق ويجعله منفصلًا أو طالعًا/نازلًا بشكل سيئ.
- المطلوب الأخير كان أن كتلة الكلام كلها تتوسط عموديًا داخل الشريط الأزرق، أي العنوان + بوكس النص + الزر.
- التعديل الحالي يعتمد على `.hiw-ai`:
  - `min-height: 218px`
  - `padding: 82px 60px 0 0`
  - وفي breakpoint `max-width: 1439px`: `padding: 70px 48px 0 0`
- البوكس الداخلي `.hiw-ai-panel` صار أقصر عرضًا من السابق:
  - `width: min(100%, 820px)`
  - في المتوسط: `width: min(100%, 720px)`
- نص البوكس `.hiw-ai-panel p` مقيّد تقريبًا بـ `max-width: 520px` ومتمركز عموديًا داخل البوكس.
- تحقق بصريًا على عرض `1366px` عند تعديل هذا الجزء، لأن أغلب المشاكل ظهرت هناك.

## السكشن 5: Learn Section

ملفات مهمة:

- `src/app/modules/landingPage/pages/home/sections/learn/learn-section/learn-section.component.html`
- `src/app/modules/landingPage/pages/home/sections/learn/learn-section/learn-section.component.css`
- `src/app/modules/landingPage/pages/home/sections/learn/learn-section/learn-section.component.ts`

أصول مهمة:

- `src/assets/images/anima-home/learn-education.png`

ما تم:

- فصل السكشن داخل `app-learn-section`.
- السكشن مركب بعد `app-how-it-works-section`.
- يحتوي على صورة الطاقية التعليمية، عنوان `جزء من يلي راح تتعلمه :`، 5 كروت محتوى، وكرت CTA أخير.

قرارات وملاحظات:

- الطاقية تم تعديل موضعها حتى لا تدخل في السكشن الذي فوقها.
- النصوص داخل الكروت يجب أن تكون RTL وعلى اليمين.
- على الموبايل الكروت تكون عمودية.
- الخط الأزرق داخل الكرت يبقى ظاهرًا على الموبايل.
- اللمسة المطلوبة لهذا السكشن كانت أنيميشن فقط بدون تغيير شكل كبير:
  - float خفيف للطاقية.
  - shimmer على الخط الأزرق.
  - hover بسيط وراقي للكروت.
- لا تضف عناصر جديدة كثيرة لهذا السكشن إلا إذا طلب المستخدم صراحة.

## السكشن 6: Why Free Section

ملفات مهمة:

- `src/app/modules/landingPage/pages/home/sections/why-free/why-free-section/why-free-section.component.html`
- `src/app/modules/landingPage/pages/home/sections/why-free/why-free-section/why-free-section.component.css`
- `src/app/modules/landingPage/pages/home/sections/why-free/why-free-section/why-free-section.component.ts`

أصول مهمة:

- `src/assets/images/anima-home/why-free-studio.png`

مصدر الصورة:

```text
C:\Users\Hosam\Downloads\AnimaPackage-React-VXe00 (2)\static\img\sademployee-1-2.png
```

ما تم:

- فصل السكشن داخل `app-why-free-section`.
- السكشن مركب بعد `app-learn-section`.
- يستخدم صورة الاستوديو/الشخص الحمراء البنفسجية من تصميم Figma/Anima.
- يحتوي على badge `السؤال المهم`، عنوان `إذا التداول بيشتغل بهذه الطريقة... ليش أشرح كل هذا مجاناً؟`، فقرة، صندوقين شرح، وCTA.

قرارات الديسكتوب:

- التخطيط الأساسي grid: صورة يسار ومحتوى يمين.
- الصندوقان في الديسكتوب الواسع بثلاث أعمدة: النص يسار، الخط الأزرق بالوسط، العنوان يمين.
- في العروض المتوسطة تم حل مشكلة قص العنوان:
  - من `1101px` إلى `1360px` تتحول الصناديق لترتيب عمودي.
  - من `1361px` إلى `1450px` تبقى أفقية لكن بأعمدة مرنة.
- لا ترجع الصناديق إلى أعمدة ثابتة كبيرة في العروض المتوسطة، لأن هذا كان يقص عنوان مثل `كن المهم جداً تفهم:`.

قرارات الموبايل:

- أعلى السكشن في الموبايل centered:
  - badge.
  - العنوان.
  - الفقرة.
- الصندوقان في الموبايل بترتيب: العنوان فوق، الخط الأزرق، النص تحت.
- الخط الأزرق لا يختفي على الموبايل.
- تم ضبط عرض المحتوى على الموبايل حتى لا يخرج على أطراف الشاشة.

أنيميشن ولمسات:

- حركة breathing خفيفة للصورة.
- حركة بسيطة للخط الأزرق المتقطع داخل الصناديق.
- hover على الصندوقين.
- hover للزر الذهبي.
- يوجد `prefers-reduced-motion` لتعطيل الحركة.

ملاحظات مهمة:

- لا تستورد CSS هذا السكشن عالميًا في `styles.css`.
- السكشن يعتمد على ملفه الخاص.
- إذا ظهرت مشكلة ستايل، افحص module/declaration/encapsulation قبل اللجوء إلى import عالمي.

## Wiring / Module

تم تعريف السكاشن في:

`src/app/modules/landingPage/landingPage.module.ts`

Imports/Declarations مهمة:

- `VideoTestimonialsSectionComponent`
- `ScreenshotsSectionComponent`
- `HowItWorksSectionComponent`
- `LearnSectionComponent`
- `WhyFreeSectionComponent`

في:

`src/app/modules/landingPage/pages/home/home.component.ts`

يوجد:

```ts
openPopupFromVideoTestimonials = () => this.openRegistrationPopup('video_testimonials');
openPopupFromHowItWorks = () => this.openRegistrationPopup('how_it_works');
openPopupFromLearn = () => this.openRegistrationPopup('learn');
openPopupFromWhyFree = () => this.openRegistrationPopup('why_free');
```

## حالة Git الحالية المتوقعة

توجد تعديلات وملفات untracked كثيرة من السكاشن الجديدة. لا تعمل revert لها.

ملفات معدلة/جديدة متوقعة:

- `src/app/modules/landingPage/pages/home/home.component.html`
- `src/app/modules/landingPage/landingPage.module.ts`
- `src/app/modules/landingPage/pages/home/sections/stats/...`
- `src/app/modules/landingPage/pages/home/sections/video-testimonials/...`
- `src/app/modules/landingPage/pages/home/sections/screenshots/...`
- `src/app/modules/landingPage/pages/home/sections/how-it-works/...`
- `src/app/modules/landingPage/pages/home/sections/learn/...`
- `src/app/modules/landingPage/pages/home/sections/why-free/...`
- أصول جديدة تحت `src/assets/images/anima-home/`

## أوامر التحقق

Build development:

```powershell
npx ng build --configuration development --output-path .\.tmp-angular-build
```

تنظيف آمن:

```powershell
$target = Resolve-Path '.\.tmp-angular-build'
$root = Resolve-Path '.'
if ($target.Path.StartsWith($root.Path) -and (Split-Path $target.Path -Leaf) -eq '.tmp-angular-build') {
  Remove-Item -LiteralPath $target.Path -Recurse -Force
}
```

آخر حالة تحقق:

- `ng serve` المحلي اشتغل وظهر `Compiled successfully`.
- `npm run build` قد يتوقف بسبب CSS budget قديم في:
  `src/app/modules/landingPage/pages/home/sections/video-testimonials/video-testimonials-section/video-testimonials-section.component.css`
- هذا budget معروف وليس بالضرورة بسبب آخر تعديلات `how-it-works` أو `why-free`.
