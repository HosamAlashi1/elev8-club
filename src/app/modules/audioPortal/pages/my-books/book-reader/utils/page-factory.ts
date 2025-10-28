// utils/page-factory.ts
// محرّك صفحات كتاب: يبني صفحات HTML مُرقّمة مع هيدر/فوتر وتقسيم فِعلي للنص.

export interface FlowNode {
  id: string;
  type: 'h1' | 'h2' | 'p';
  text: string;
  chapterId?: number;
}

export interface Chapter {
  id: number;
  title: string;
}

export interface BookConfig {
  settings?: {
    page?: { width: number; height: number; gutter: number; padding: number };
    typography?: { font: string; size: number; lineHeight: number };
    theme?: 'light' | 'sepia' | 'dark';
    spread?: boolean;
    rtl?: boolean;
    language?: string;
  };
  title?: string;
}

export interface BuiltPage /* متوافق مع Page عندك */ {
  html: string;
  pageNumber: number;
  chapterId?: number;
  chapterTitle?: string;
  // معلومات إضافية لو حاب تستخدمها لاحقًا
  __side?: 'left' | 'right';
}

type TypesetterCtx = {
  host: HTMLElement;
  pageBox: HTMLElement;     // يمثّل مساحة المحتوى فقط (بدون الهيدر/الفوتر)
  maxHeight: number;
  cfg: RequiredCfg;
};

type RequiredCfg = {
  width: number;
  height: number;
  padding: number;
  gutter: number;
  font: string;
  size: number;
  lineHeight: number;
  rtl: boolean;
  lang: string;
};

const DEFAULTS = {
  width: 820,
  height: 900,
  padding: 30,
  gutter: 20,
  font: 'Georgia, serif',
  size: 15,
  lineHeight: 1.6,
  rtl: false,
  lang: 'en'
};

function compileCfg(book?: BookConfig): RequiredCfg {
  const p = book?.settings?.page;
  const t = book?.settings?.typography;
  return {
    width: p?.width ?? DEFAULTS.width,
    height: p?.height ?? DEFAULTS.height,
    padding: p?.padding ?? DEFAULTS.padding,
    gutter: p?.gutter ?? DEFAULTS.gutter,
    font: t?.font ?? DEFAULTS.font,
    size: t?.size ?? DEFAULTS.size,
    lineHeight: t?.lineHeight ?? DEFAULTS.lineHeight,
    rtl: !!book?.settings?.rtl,
    lang: (book as any)?.language ?? DEFAULTS.lang
  };
}

// =============== Public API ===============
export function paginateFlow(
  flow: FlowNode[],
  book: BookConfig | undefined,
  chapters: Chapter[]
): BuiltPage[] {
  const cfg = compileCfg(book);

  const ctx = createTypesetter(cfg);
  try {
    const built: BuiltPage[] = [];
    let pageNumber = 1;
    let currentChapterId: number | undefined;
    let currentChapterTitle = '';
    let keepWithNext = false; // للعنوان مع أول فقرة
    let pendingHeader: string | null = null;


    // صفحة جديدة
    const newPage = () => {
      clearTypesetterPage(ctx);
    };
    newPage();

    const commitPage = () => {
      const side: 'left' | 'right' = (pageNumber % 2 === 0) ? 'left' : 'right';

      // استخدم العنوان لهذه الصفحة فقط لو كان pendingHeader موجود
      const headerForThisPage = pendingHeader ?? '';

      const html = renderFinalPageHTML(ctx, cfg, pageNumber, headerForThisPage, side);

      built.push({
        html,
        pageNumber,
        chapterId: currentChapterId,
        // احتفظ بعنوان الفصل كبيان (اختياري) لكن الهيدر الفعلي تحكمنا فيه عبر headerForThisPage
        chapterTitle: currentChapterTitle,
        __side: side
      });

      pageNumber++;
      // استهلكنا العنوان: لا تعيده في الصفحات التالية
      pendingHeader = null;
    };


    // مر على عناصر التدفق
    for (let i = 0; i < flow.length; i++) {
      const node = flow[i];

      if (node.type === 'h2') {
        // فلّش أي صفحة مفتوحة قبل الفصل
        while (!isPageEmpty(ctx)) commitPage();

        currentChapterId = node.chapterId ?? currentChapterId;
        currentChapterTitle = node.text;

        // اعرض الهيدر مرة واحدة في الصفحة التالية فقط
        pendingHeader = node.text;

        keepWithNext = true;
        const h = block('h2', node.text, 'ch-title');
        ctx.pageBox.appendChild(h);

        if (isOverflow(ctx)) {
          removeLastChild(ctx.pageBox);
          commitPage();                       // يستهلك pendingHeader لهذه الصفحة
          ctx.pageBox.appendChild(block('h2', node.text, 'ch-title'));
        }
        continue;
      }

      if (node.type === 'h1') {
        // صفحة مستقلة لعنوان الكتاب
        while (!isPageEmpty(ctx)) commitPage();

        ctx.pageBox.appendChild(block('h1', node.text, 'bk-title'));
        commitPage();            // خلّص صفحة العنوان
        keepWithNext = false;
        continue;
      }

      if (node.type === 'p') {
        const paraEl = block('p', node.text, keepWithNext ? 'keep-with-prev' : '');
        // لو لازم نضمن "keep-with-next" مع العنوان: نختبر إذا الفقرة ستطفّح الصفحة
        if (keepWithNext) {
          const fitsWithPrev = testAppendFits(ctx, paraEl);
          if (!fitsWithPrev) {
            // اقفل الصفحة الماضية بالعنوان فقط، وافتح صفحة جديدة للفقرة
            removeLastChild(ctx.pageBox); // شيل الفقرة المؤقتة
            commitPage();
            ctx.pageBox.appendChild(block('h2', currentChapterTitle, 'ch-title'));
            // الآن ضف الفقرة من جديد
            appendWithSplit(ctx, node.text, commitPage);
          } else {
            // رجّع الإضافة لأنه كان test فقط
            removeLastChild(ctx.pageBox);
            // أضف الفقرة فعليًا
            appendWithSplit(ctx, node.text, commitPage);
          }
          keepWithNext = false;
        } else {
          appendWithSplit(ctx, node.text, commitPage);
        }

        // حدّث chapterId للمحتوى الحالي
        if (node.chapterId != null) currentChapterId = node.chapterId;
      }
    }

    // الصفحة الأخيرة
    while (!isPageEmpty(ctx)) commitPage();


    return built;
  } finally {
    destroyTypesetter(ctx);
  }
}

function trimToFitByWords(ctx: TypesetterCtx, text: string): string {
  const words = text.split(/\s+/);
  let fit = '';

  for (let i = 1; i <= words.length; i++) {
    const sub = words.slice(0, i).join(' ');
    const tmp = block('p', sub);
    ctx.pageBox.appendChild(tmp);
    const overflow = isOverflow(ctx);
    removeLastChild(ctx.pageBox);

    if (overflow) break;
    fit = sub;
  }
  return fit.trim();
}


function createTypesetter(cfg: RequiredCfg): TypesetterCtx {
  // نبني صفحة وهمية بنفس هيكل الكتاب ونقفل المقاسات inline
  const host = document.createElement('div');
  host.className = 'pg pg-right';
  host.style.cssText = `
    position: fixed; left: -99999px; top: -99999px; visibility: hidden;
    width: ${cfg.width}px; height: ${cfg.height}px;
    display: grid; grid-template-rows: 52px 1fr 44px; /* header / body / footer */
    box-sizing: border-box;
  `;

  host.innerHTML = `
    <header class="pg-header"><div class="pg-chapter"></div></header>
    <main class="pg-body"></main>
    <footer class="pg-footer"><div class="pg-number"></div></footer>
  `;

  document.body.appendChild(host);

  const headerEl = host.querySelector('.pg-header') as HTMLElement;
  const footerEl = host.querySelector('.pg-footer') as HTMLElement;
  const bodyEl   = host.querySelector('.pg-body')   as HTMLElement;

  // نثبت البادينغ والخطوط inline عشان القياس يطابق صفحاتك
  bodyEl.style.padding    = '24px 32px 16px';
  bodyEl.style.fontFamily = cfg.font;
  bodyEl.style.fontSize   = `${cfg.size}px`;
  bodyEl.style.lineHeight = String(cfg.lineHeight);
  bodyEl.style.direction  = cfg.rtl ? 'rtl' : 'ltr';
  bodyEl.style.hyphens    = 'auto';
  bodyEl.style.wordBreak  = 'break-word';
  bodyEl.style.overflow   = 'hidden';

  // احسب ارتفاع مساحة الكتابة داخل الـ body
  const headerH = Math.ceil(headerEl.getBoundingClientRect().height);
  const footerH = Math.ceil(footerEl.getBoundingClientRect().height);

  const cs = getComputedStyle(bodyEl);
  const padTop    = parseFloat(cs.paddingTop)    || 0;
  const padBottom = parseFloat(cs.paddingBottom) || 0;
  const padLeft   = parseFloat(cs.paddingLeft)   || 0;
  const padRight  = parseFloat(cs.paddingRight)  || 0;

  const contentHeight = Math.max(0, host.clientHeight - headerH - footerH - padTop - padBottom);
  const contentWidth  = Math.max(0, host.clientWidth  - padLeft - padRight);

  bodyEl.style.height = `${contentHeight}px`;
  bodyEl.style.width  = `${contentWidth}px`;

  return {
    host,
    pageBox: bodyEl,
    maxHeight: contentHeight,
    cfg
  };
}

function isOverflow(ctx: TypesetterCtx) {
  const tolerance = 1; // px بسيط لتجنّب "أكل" آخر سطر
  return ctx.pageBox.scrollHeight > ctx.maxHeight + tolerance;
}


function destroyTypesetter(ctx: TypesetterCtx) {
  ctx.host.remove();
}

function clearTypesetterPage(ctx: TypesetterCtx) {
  ctx.pageBox.innerHTML = '';
}

function isPageEmpty(ctx: TypesetterCtx) {
  return ctx.pageBox.childElementCount === 0;
}

function removeLastChild(el: HTMLElement) {
  if (el.lastElementChild) el.removeChild(el.lastElementChild);
}

function testAppendFits(ctx: TypesetterCtx, el: HTMLElement) {
  ctx.pageBox.appendChild(el);
  const fits = !isOverflow(ctx);
  removeLastChild(ctx.pageBox);
  return fits;
}

function block(tag: 'p' | 'h1' | 'h2', text: string, cls = '') {
  const el = document.createElement(tag);
  el.textContent = text ?? '';
  if (cls) el.className = cls;
  // ستايل بسيط افتراضي داخل الباحث (فقط للمقاييس)
  (el.style as any).cssText = baseInlineStyleForTag(tag);
  return el;
}

function baseInlineStyleForTag(tag: string) {
  if (tag === 'h1') return 'margin: 0 0 18px; font-weight:700; font-size: 1.6em; text-align:center;';
  if (tag === 'h2') return 'margin: 0 0 14px; font-weight:700; font-size: 1.25em;';
  return 'margin: 0 0 12px;';
}

function appendWithSplit(ctx: TypesetterCtx, text: string, onBreak: () => void) {
  // جرّب الفقرة كاملة أولًا
  const p = block('p', text);
  ctx.pageBox.appendChild(p);
  if (!isOverflow(ctx)) return;

  // الصفحة ما وسعت: احذف الفقرة وابدأ التقطيع الذكي
  removeLastChild(ctx.pageBox);
  let rest = text.trim();
  let safety = 0; // مانع اللانهاية

  while (rest.length && safety++ < 2000) {
    // ✂️ أولًا: حاول تقسيم النص إلى جمل مفهومة
    const sentences = rest.split(/(?<=[.?!،…])\s+/);
    let fitSentences = '';
    let overflowed = false;

    for (let i = 0; i < sentences.length; i++) {
      const candidate = (fitSentences + ' ' + sentences[i]).trim();
      const testEl = block('p', candidate);
      ctx.pageBox.appendChild(testEl);

      if (isOverflow(ctx)) {
        overflowed = true;
        removeLastChild(ctx.pageBox);
        break; // توقّف عند الجملة اللي طفحت
      }

      removeLastChild(ctx.pageBox);
      fitSentences = candidate;
    }

    // ✅ لو الجمل كلها ما وسعتش، ننتقل للتقطيع بالكلمات
    if (!fitSentences) {
      const [fitWords, remainingWords] = fitWordsByBinary(ctx, rest);
      if (!fitWords) {
        // الصفحة فاضية بالكامل، خذ كلمة واحدة على الأقل
        const firstWord = rest.split(/\s+/)[0];
        ctx.pageBox.appendChild(block('p', firstWord));
        onBreak();
        rest = rest.slice(firstWord.length).trim();
        continue;
      }

      ctx.pageBox.appendChild(block('p', fitWords));

      // بعد الإضافة، تأكد من عدم الطفح المفاجئ
      if (isOverflow(ctx)) {
        removeLastChild(ctx.pageBox);
        const [fit2] = fitWordsByBinary(ctx, fitWords, true);
        if (fit2) ctx.pageBox.appendChild(block('p', fit2));
      }

      if (remainingWords) {
        onBreak();
        rest = remainingWords.trim();
        continue;
      }
      break;
    }

    // ✅ أضف الجمل اللي بتسع
    ctx.pageBox.appendChild(block('p', fitSentences));

    // تحقق لو الصفحة طفحت بعد الإضافة
    if (isOverflow(ctx)) {
      removeLastChild(ctx.pageBox);
      onBreak();
      continue;
    }

    // احسب ما تبقّى
    const remainingSentences = sentences.slice(fitSentences.split(/(?<=[.?!،…])\s+/).length).join(' ');
    rest = remainingSentences.trim();

    // لو باقي نص، فلّش الصفحة
    if (rest.length > 0) onBreak();
  }
}

function fitWordsByBinary(ctx: TypesetterCtx, text: string, shrink = false): [string, string] {
  const words = text.split(/\s+/);
  let lo = 0, hi = words.length, best = 0;

  // عنصر مؤقت واحد فقط
  const tmp = block('p', '');
  tmp.setAttribute('data-tmp', '1');
  ctx.pageBox.appendChild(tmp);

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    tmp.textContent = words.slice(0, mid).join(' ');
    const overflow = isOverflow(ctx);

    if (!overflow) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  // أمان للسطر الأخير
  if (shrink && best > 0) best = Math.max(1, best - 1);

  const fit = words.slice(0, best).join(' ').trim();
  const remaining = words.slice(best).join(' ').trim();

  tmp.remove(); // مهم: لا نترك أي tmp

  return [fit, remaining];
}

// يحوّل محتوى الـ typesetter الحالي إلى HTML صفحة فعلية بهيدر/فوتر
function renderFinalPageHTML(
  ctx: TypesetterCtx,
  cfg: RequiredCfg,
  pageNumber: number,
  chapterTitle: string,
  side: 'left' | 'right'
): string {
  // استخرج البلوكات لغاية فاصل الصفحة (أو كل شيء)
  const fragments: HTMLElement[] = [];
  while (ctx.pageBox.firstElementChild) {
    const el = ctx.pageBox.firstElementChild as HTMLElement;
    ctx.pageBox.removeChild(el);
    if (el.classList.contains('__PAGE_BREAK__')) break;
    fragments.push(el);
  }

  // حوّلهم إلى HTML نصّي
  const contentHTML = fragments.map(el => {
    const tag = el.tagName.toLowerCase();
    const cls = el.className ? ` class="${el.className}"` : '';
    return `<${tag}${cls}>${escapeHTML(el.textContent || '')}</${tag}>`;
  }).join('');

  const dir = cfg.rtl ? 'rtl' : 'ltr';
  const sideCls = side === 'left' ? 'pg-left' : 'pg-right';

  return `
  <div class="pg ${sideCls}" dir="${dir}" lang="${cfg.lang}">
    <header class="pg-header">
      ${chapterTitle ? `<div class="pg-chapter">${escapeHTML(chapterTitle)}</div>` : ''}
    </header>
    <main class="pg-body">
      ${contentHTML || '<p>&nbsp;</p>'}
    </main>
    <footer class="pg-footer">
      <div class="pg-number">${pageNumber}</div>
    </footer>
  </div>`.trim();
}

function escapeHTML(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== Fore-edge helper (اختياري للاستيراد في الـComponent) =====
export type ForeEdges = {
  leftPx: number;      // يسار = المقروء
  rightPx: number;     // يمين = المتبقي
  readCount: number;
  remainingCount: number;
};

/**
 * leftPage: رقم الصفحة اليسار في السبريد الحالي (1-based)
 * totalPages: إجمالي الصفحات
 * maxPx/minPx: سماكة الحافة القصوى/الدنيا
 */
export function computeForeEdges(
  leftPage: number,
  totalPages: number,
  maxPx = 16,
  minPx = 3
): ForeEdges {
  const readCount = Math.max(0, leftPage - 1);
  const rightPage = leftPage + 1;
  const remainingCount = Math.max(0, totalPages - rightPage);

  const curve = (pages: number, total: number) => {
    if (total <= 1) return minPx;
    const r = Math.min(1, Math.max(0, pages / total));
    return Math.round(minPx + (maxPx - minPx) * Math.pow(r, 0.9));
  };

  return {
    leftPx: curve(readCount, totalPages),
    rightPx: curve(remainingCount, totalPages),
    readCount,
    remainingCount
  };
}

