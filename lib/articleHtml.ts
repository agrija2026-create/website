/** 記事 HTML の加工（見出し id / 目次用データ / 表ラップ）と読了目安 */

export type TocItem = {
  level: 2 | 3;
  text: string;
  id: string;
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function ensureUniqueId(base: string, used: Set<string>): string {
  let id = base || "section";
  let n = 0;
  while (used.has(id)) {
    n += 1;
    id = `${base}-${n}`;
  }
  used.add(id);
  return id;
}

function slugifyHeadingId(text: string, index: number, used: Set<string>): string {
  const normalized = text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .slice(0, 80)
    .toLowerCase();
  const base = normalized || `section-${index}`;
  return ensureUniqueId(base, used);
}

/**
 * h2/h3 に id を付与（無い場合）し、目次用配列を返す。表を横スクロール用ラッパーで囲む。
 */
export function enrichArticleHtml(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();
  let index = 0;

  const withHeadings = html.replace(
    /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi,
    (full, levelStr: string, attrs: string, inner: string) => {
      const level = Number(levelStr) as 2 | 3;
      const text = stripTags(inner);
      if (!text) return full;

      const idAttrMatch = attrs.match(/\bid\s*=\s*(["'])([^"']*)\1/i);
      const existingId = idAttrMatch?.[2]?.trim();

      if (existingId) {
        let id = existingId;
        if (usedIds.has(id)) {
          id = ensureUniqueId(`${existingId}-dup`, usedIds);
          const newAttrs = attrs.replace(idAttrMatch[0], `id="${id}"`);
          toc.push({ level, text, id });
          return `<h${levelStr}${newAttrs}>${inner}</h${levelStr}>`;
        }
        usedIds.add(id);
        toc.push({ level, text, id });
        return full;
      }

      const id = slugifyHeadingId(text, index++, usedIds);
      const newAttrs = attrs.trim() ? `${attrs} id="${id}"` : ` id="${id}"`;
      toc.push({ level, text, id });
      return `<h${levelStr}${newAttrs}>${inner}</h${levelStr}>`;
    },
  );

  const withTables = wrapTables(withHeadings);
  return { html: withTables, toc };
}

function wrapTables(html: string): string {
  let result = "";
  let i = 0;
  const lower = html.toLowerCase();
  while (i < html.length) {
    const open = lower.indexOf("<table", i);
    if (open === -1) {
      result += html.slice(i);
      break;
    }
    result += html.slice(i, open);
    const closeIdx = lower.indexOf("</table>", open);
    if (closeIdx === -1) {
      result += html.slice(open);
      break;
    }
    const end = closeIdx + "</table>".length;
    const chunk = html.slice(open, end);
    result +=
      '<div class="article-table-scroll" tabindex="0" role="region" aria-label="表（横にスクロールできます）">' +
      chunk +
      "</div>";
    i = end;
  }
  return result;
}

/** 日本語本文のおおよその読了時間（分）。文字数÷500、最低1分 */
export function estimateReadingMinutesJa(html: string, description: string): number {
  const text = stripTags(html) + " " + (description || "");
  const charCount = [...text].length;
  const minutes = Math.ceil(charCount / 500);
  return Math.max(1, Math.min(minutes, 180));
}
