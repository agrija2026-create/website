/** 記事 HTML の加工（見出し id / 目次用データ / 表ラップ）と読了目安 */

export type TocItem = {
  level: 2 | 3;
  text: string;
  id: string;
};

export function stripTags(html: string): string {
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

/** Unicode プロパティエスケープはビルドターゲットによって失敗することがあるため、漢字・かな・英数字のレンジで除去する */
function slugifyHeadingId(text: string, index: number, used: Set<string>): string {
  const normalized = text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(
      /[^a-zA-Z0-9\u3005-\u3007\u3041-\u3096\u309D-\u309E\u30A1-\u30FA\u30FC-\u30FE\u4E00-\u9FFF_-]+/g,
      "",
    )
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
        if (usedIds.has(id) && idAttrMatch) {
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
    const chunk = normalizeTableChunk(html.slice(open, end));
    result +=
      '<div class="article-table-scroll" tabindex="0" role="region" aria-label="表（横にスクロールできます）">' +
      chunk +
      "</div>";
    i = end;
  }
  return result;
}

const SUMMARY_COLGROUP =
  '<colgroup><col class="article-summary-table-col-key" /><col class="article-summary-table-col-value" /></colgroup>';

function ensureSummaryColgroup(chunk: string): string {
  if (/<colgroup\b/i.test(chunk)) {
    return chunk;
  }
  return chunk.replace(/(<table\b[^>]*>)/i, `$1${SUMMARY_COLGROUP}`);
}

function normalizeTableChunk(chunk: string): string {
  const hasSummaryClass = /\barticle-summary-table\b/i.test(chunk);
  const hasDataClass = /\barticle-data-table\b/i.test(chunk);
  if (hasSummaryClass || hasDataClass) {
    if (hasSummaryClass) {
      return ensureSummaryColgroup(chunk);
    }
    return chunk;
  }

  const columnCount = inferTableColumnCount(chunk);
  const inferredClass = columnCount <= 2 ? "article-summary-table" : "article-data-table";
  const withClass = appendClassToTable(chunk, inferredClass);
  if (inferredClass === "article-summary-table") {
    return ensureSummaryColgroup(withClass);
  }
  return withClass;
}

function inferTableColumnCount(chunk: string): number {
  const rows = chunk.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
  let maxCells = 0;

  for (const row of rows) {
    const cellCount = row.match(/<(?:th|td)\b/gi)?.length ?? 0;
    if (cellCount > maxCells) {
      maxCells = cellCount;
    }
  }

  return Math.max(maxCells, 1);
}

function appendClassToTable(chunk: string, className: string): string {
  return chunk.replace(/<table\b([^>]*)>/i, (full, attrs: string) => {
    const classMatch = attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i);

    if (classMatch) {
      const existingClasses = classMatch[2]
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean);

      if (!existingClasses.includes(className)) {
        existingClasses.push(className);
      }

      return `<table${attrs.replace(classMatch[0], `class="${existingClasses.join(" ")}"`)}>`;
    }

    return attrs.trim()
      ? `<table${attrs} class="${className}">`
      : `<table class="${className}">`;
  });
}

/**
 * 本文の途中にCTAを挟むために、記事HTMLを2つに割る。
 *
 * 記事末に置いたCTAは記事PVの15〜37%にしか表示されていなかった（2026-08-07のGA4実測）ため、
 * 読者が離脱する前に通る位置＝本文の中ほどの h2 の直前で割る。
 * 割った両側とも `<article>` で包み直す（`.article-body article > * + *` が段落間の余白を作っており、
 * 素の断片にすると本文の行間が崩れるため）。
 *
 * 割れないときは null を返す（呼び出し側は記事末に置いたままにする）:
 * - `<article>` で包まれていない
 * - h2 が3つ未満（最初と最後の h2 は候補にしない。冒頭すぎ・末尾すぎになる）
 * - どの候補でも前半のタグが閉じきらない（h2 が section や div の中にある記事）
 */
const BALANCE_CHECK_TAGS = [
  "div",
  "section",
  "table",
  "ul",
  "ol",
  "nav",
  "figure",
  "aside",
  "dl",
  "blockquote",
  "details",
];

function hasBalancedContainers(html: string): boolean {
  return BALANCE_CHECK_TAGS.every((tag) => {
    const open = html.match(new RegExp(`<${tag}[\\s>]`, "gi"))?.length ?? 0;
    const close = html.match(new RegExp(`</${tag}\\s*>`, "gi"))?.length ?? 0;
    return open === close;
  });
}

/**
 * CTAを置きたい位置（本文の文字数に対する割合）。
 * 本文の説明が一通り終わってFAQ・関連の節に入るあたり。手前すぎると読者が知りたい節を
 * 遮り、後ろすぎると記事末と変わらない。HTMLの長さではなく本文の文字数で測る
 * （表や属性が多い記事はHTMLが長くなり、実際の読む位置とずれるため）。
 */
const MID_CTA_TARGET_RATIO = 0.6;

export function splitArticleHtmlForMidCta(
  html: string,
): { before: string; after: string } | null {
  const openMatch = html.match(/^\s*<article\b[^>]*>/i);
  if (!openMatch) return null;
  const openTag = openMatch[0].trimStart();
  const closeIndex = html.toLowerCase().lastIndexOf("</article>");
  if (closeIndex < 0) return null;

  const inner = html.slice(openMatch[0].length, closeIndex);
  const offsets = [...inner.matchAll(/<h2[\s>]/gi)].map((m) => m.index ?? 0);
  if (offsets.length < 3) return null;

  const totalTextLength = stripTags(inner).length || 1;
  const candidates = offsets.slice(1, -1);
  const ratioAt = new Map(
    candidates.map((index) => [index, stripTags(inner.slice(0, index)).length / totalTextLength]),
  );
  candidates.sort(
    (a, b) =>
      Math.abs((ratioAt.get(a) ?? 0) - MID_CTA_TARGET_RATIO) -
      Math.abs((ratioAt.get(b) ?? 0) - MID_CTA_TARGET_RATIO),
  );

  for (const index of candidates) {
    const head = inner.slice(0, index);
    if (!hasBalancedContainers(head)) continue;
    return {
      before: `${openTag}${head}</article>`,
      after: `${openTag}${inner.slice(index)}</article>`,
    };
  }
  return null;
}

/** 日本語本文のおおよその読了時間（分）。文字数÷1200、最低1分 */
export function estimateReadingMinutesJa(html: string, description: string): number {
  const text = stripTags(html) + " " + (description || "");
  const charCount = [...text].length;
  const minutes = Math.ceil(charCount / 1200);
  return Math.max(1, Math.min(minutes, 180));
}
