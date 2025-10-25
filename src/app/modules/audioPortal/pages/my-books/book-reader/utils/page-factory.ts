export interface ParagraphLike { 
  id: number | string; 
  text: string; 
  is_title: boolean; 
  type?: 'h1' | 'h2' | 'h3' | 'p';
}

export interface FlowItem {
  id: string;
  type: 'h1' | 'h2' | 'p' | 'img';
  text?: string;
  chapterId?: number;
  src?: string;
  alt?: string;
}

export interface Page {
  html: string;
  pageNumber: number;
  chapterId?: number;
  chapterTitle?: string;
}

export interface PageBuildOptions {
  pageWidth?: number;
  pageHeight?: number;
  padding?: number;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
}

/** الحجم يجب أن يطابق إعداد PageFlip + padding في CSS */
const DEFAULT_PAGE_W = 400;
const DEFAULT_PAGE_H = 550;
const DEFAULT_PAD = 30;

/**
 * يبني الصفحات تلقائياً حسب ارتفاع المحتوى
 * مع دعم keep-with-next و widows/orphans
 */
export function buildPagesAuto(
  title: string, 
  paras: ParagraphLike[],
  options: PageBuildOptions = {}
): HTMLElement[] {
  const PAGE_W = options.pageWidth || DEFAULT_PAGE_W;
  const PAGE_H = options.pageHeight || DEFAULT_PAGE_H;
  const PAD = options.padding || DEFAULT_PAD;
  const CONTENT_W = PAGE_W - PAD * 2;
  const CONTENT_H = PAGE_H - PAD * 2;

  const pages: HTMLElement[] = [];
  
  // صفحة العنوان
  pages.push(makePage(`<h2 class="book-title">${escapeHtml(title)}</h2>`));

  // حاوية قياس مخفية بنفس ستايل الصفحة
  const measure = createMeasurer(CONTENT_W, CONTENT_H, options);
  document.body.appendChild(measure);

  let pageEl = newPage();
  let contentEl = pageEl.firstElementChild as HTMLDivElement;

  const pushPage = () => { 
    pages.push(pageEl); 
    pageEl = newPage(); 
    contentEl = pageEl.firstElementChild as HTMLDivElement; 
  };

  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    const nextP = paras[i + 1];
    
    // تحديد نوع العنصر
    const tag = getTagForParagraph(p);
    const isHeading = tag.startsWith('h');
    
    // كسر الفقرة الكبيرة لوحدات كلمات
    const words = (p.text || '').split(/\s+/).filter(w => w.trim());
    let cur = document.createElement(tag);
    cur.setAttribute('data-para-id', String(p.id));
    
    // Keep-with-next: العناوين يجب أن تبقى مع الفقرة التالية
    const keepWithNext = isHeading && nextP;

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      cur.append(words[wordIdx] + (wordIdx < words.length - 1 ? ' ' : ''));

      // قياس ارتفاع الصفحة لو أضفنا العناصر الحالية
      measure.innerHTML = '';
      measure.append(
        ...Array.from(contentEl.children).map(n => n.cloneNode(true)), 
        cur.cloneNode(true)
      );

      // إذا امتلأت الصفحة
      if (measure.scrollHeight > CONTENT_H) {
        // تجنب widows (سطر واحد في نهاية الصفحة)
        const currentWords = cur.textContent?.split(/\s+/).filter(w => w.trim()) || [];
        if (currentWords.length === 1 && !isHeading) {
          // لا تترك كلمة واحدة، أضفها للصفحة التالية
          pushPage();
          cur = document.createElement(tag);
          cur.setAttribute('data-para-id', String(p.id));
          cur.textContent = words[wordIdx];
          continue;
        }

        // أضف ما بُني حتى الآن
        if (cur.textContent?.trim()) {
          contentEl.appendChild(cur.cloneNode(true));
        }
        
        pushPage();
        
        // ابدأ سطر جديد بباقي الكلمات
        cur = document.createElement(tag);
        cur.setAttribute('data-para-id', String(p.id));
        cur.setAttribute('data-continued', 'true');
      }
    }

    // أضف المتبقي للصفحة
    if (cur.textContent?.trim()) {
      // Keep-with-next: إذا كان عنوان، تأكد أنه يبقى مع جزء من الفقرة التالية
      if (keepWithNext) {
        // قس المساحة المطلوبة للعنوان + بداية الفقرة التالية
        const testNext = document.createElement('p');
        const nextWords = (nextP.text || '').split(/\s+/).slice(0, 5).join(' ');
        testNext.textContent = nextWords + '...';
        
        measure.innerHTML = '';
        measure.append(
          ...Array.from(contentEl.children).map(n => n.cloneNode(true)),
          cur.cloneNode(true),
          testNext
        );
        
        if (measure.scrollHeight > CONTENT_H) {
          // لا يوجد مساحة كافية، ابدأ صفحة جديدة
          pushPage();
        }
      } else {
        // فقرة عادية، تحقق من المساحة
        measure.innerHTML = '';
        measure.append(
          ...Array.from(contentEl.children).map(n => n.cloneNode(true)), 
          cur.cloneNode(true)
        );
        
        if (measure.scrollHeight > CONTENT_H) {
          pushPage();
        }
      }
      
      contentEl.appendChild(cur);
    }
  }

  // أضف الصفحة الأخيرة إن كانت غير فارغة
  if (contentEl.children.length > 0) {
    pages.push(pageEl);
  }

  measure.remove();
  return pages;
}

/**
 * إنشاء حاوية قياس مخفية
 */
function createMeasurer(width: number, height: number, options: PageBuildOptions): HTMLDivElement {
  const measure = document.createElement('div');
  Object.assign(measure.style, {
    position: 'absolute',
    visibility: 'hidden',
    zIndex: '-1',
    width: width + 'px',
    height: height + 'px',
    padding: '0',
    overflow: 'hidden',
    lineHeight: String(options.lineHeight || 1.65),
    textAlign: 'justify',
    fontSize: (options.fontSize || 16) + 'px',
    fontFamily: options.fontFamily || 'Georgia, serif'
  });
  return measure;
}

/**
 * تحديد نوع العنصر حسب البيانات
 */
function getTagForParagraph(p: ParagraphLike): string {
  if (p.type) return p.type;
  return p.is_title ? 'h3' : 'p';
}

/**
 * إنشاء صفحة فارغة
 */
function newPage(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'page';
  const content = document.createElement('div');
  content.className = 'page-content';
  wrapper.appendChild(content);
  return wrapper;
}

/**
 * إنشاء صفحة بمحتوى HTML
 */
function makePage(inner: string): HTMLElement {
  const el = newPage();
  (el.firstElementChild as HTMLDivElement).innerHTML = inner;
  return el;
}

/**
 * تنظيف HTML
 */
function escapeHtml(s?: string): string {
  const d = document.createElement('div');
  d.innerText = s ?? '';
  return d.innerHTML;
}

/**
 * Flow-based pagination for new book reader structure
 * Converts flow array into paginated pages
 */
export function paginateFlow(
  flow: FlowItem[],
  settings: any,
  chapters: any[]
): Page[] {
  const pages: Page[] = [];
  const PAGE_W = settings.page?.width || DEFAULT_PAGE_W;
  const PAGE_H = settings.page?.height || DEFAULT_PAGE_H;
  const PAD = settings.page?.padding || DEFAULT_PAD;
  const CONTENT_W = PAGE_W - PAD * 2;
  const CONTENT_H = PAGE_H - PAD * 2;

  const measure = createMeasurer(CONTENT_W, CONTENT_H, {
    fontSize: settings.typography?.size || 16,
    lineHeight: settings.typography?.lineHeight || 1.65,
    fontFamily: settings.typography?.font || 'Georgia, serif'
  });
  document.body.appendChild(measure);

  let currentHtml = '';
  let currentChapterId: number | undefined;
  let currentChapterTitle = '';
  let pageNum = 1;

  const finishPage = () => {
    if (currentHtml.trim()) {
      pages.push({
        html: currentHtml,
        pageNumber: pageNum++,
        chapterId: currentChapterId,
        chapterTitle: currentChapterTitle
      });
      currentHtml = '';
    }
  };

  for (let i = 0; i < flow.length; i++) {
    const item = flow[i];
    const nextItem = flow[i + 1];

    // Update chapter context
    if (item.chapterId !== undefined) {
      currentChapterId = item.chapterId;
      const chapter = chapters.find(ch => ch.id === item.chapterId);
      currentChapterTitle = chapter?.title || '';
    }

    // Build element HTML
    let elementHtml = '';
    if (item.type === 'img' && item.src) {
      elementHtml = `<img src="${item.src}" alt="${escapeHtml(item.alt || '')}" class="flow-img" />`;
    } else if (item.text) {
      elementHtml = `<${item.type} class="flow-${item.type}">${escapeHtml(item.text)}</${item.type}>`;
    }

    // Keep-with-next rule for h2
    const keepWithNext = item.type === 'h2' && nextItem;

    // Test if it fits
    measure.innerHTML = currentHtml + elementHtml;
    
    if (measure.scrollHeight > CONTENT_H) {
      // Doesn't fit - finish current page
      if (currentHtml.trim()) {
        finishPage();
      }
      
      // Start new page with current element
      currentHtml = elementHtml;
      
      // If keep-with-next, ensure next element also fits
      if (keepWithNext && nextItem?.text) {
        const preview = nextItem.text.split(/\s+/).slice(0, 10).join(' ') + '...';
        const nextPreview = `<p>${escapeHtml(preview)}</p>`;
        measure.innerHTML = currentHtml + nextPreview;
        
        if (measure.scrollHeight > CONTENT_H) {
          // Not enough space, move heading to next page
          finishPage();
          currentHtml = elementHtml;
        }
      }
    } else {
      // Fits - add to current page
      currentHtml += elementHtml;
    }
  }

  // Add final page
  finishPage();

  measure.remove();
  return pages;
}
