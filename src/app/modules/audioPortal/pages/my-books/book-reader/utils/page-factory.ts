// utils/page-factory.ts
export interface ParagraphLike { id: number; text: string; is_title: boolean; }

export function buildPages(title: string, paras: ParagraphLike[]): HTMLElement[] {
  const pages: HTMLElement[] = [];

  // صفحة عنوان الفصل
  pages.push(makePage(`<h2>${escapeHtml(title)}</h2>`));

  // قاعدة أولية: فقرتان في كل صفحة (نحسنها لاحقاً بقياس DOM)
  for (let i = 0; i < paras.length; i += 2) {
    const chunk = paras.slice(i, i + 2).map(p => {
      const tag = p.is_title ? 'h3' : 'p';
      return `<${tag} data-para-id="${p.id}">${escapeHtml(p.text)}</${tag}>`;
    }).join('');
    pages.push(makePage(chunk));
  }
  return pages;
}

function makePage(inner: string) {
  const el = document.createElement('div');
  el.className = 'page';
  el.innerHTML = inner;
  return el;
}

function escapeHtml(s?: string) {
  const d = document.createElement('div');
  d.innerText = s ?? '';
  return d.innerHTML;
}
