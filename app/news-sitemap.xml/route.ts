import { getAllArticles } from "@/lib/articles";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Google ニュース用サイトマップは「直近2日以内に公開した記事」だけを載せる仕様。
 * ビルド時点を基準に判定するため、公開のたびに再ビルドされる前提で成り立つ。
 */
const WINDOW_HOURS = 48;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** frontmatter の "2026-08-03" は JST 0 時とみなす（feed.xml と同じ扱い） */
function toJstDate(dateLike: string): Date | null {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateLike)
    ? `${dateLike}T00:00:00+09:00`
    : dateLike;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** W3C Datetime（+09:00 表記）。news:publication_date に使う */
function toW3cJst(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}` +
    `T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}:${pad(jst.getUTCSeconds())}+09:00`
  );
}

export async function GET() {
  const articles = await getAllArticles();
  const threshold = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;

  const entries = articles
    .map((a) => ({ article: a, published: toJstDate(a.publishedAt) }))
    .filter(
      (x): x is { article: (typeof articles)[number]; published: Date } =>
        x.published !== null && x.published.getTime() >= threshold,
    )
    .map(({ article, published }) =>
      [
        "  <url>",
        `    <loc>${escapeXml(absoluteUrl(`/articles/${article.slug}`))}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        `        <news:name>${escapeXml(SITE_NAME)}</news:name>`,
        "        <news:language>ja</news:language>",
        "      </news:publication>",
        `      <news:publication_date>${toW3cJst(published)}</news:publication_date>`,
        `      <news:title>${escapeXml(article.title)}</news:title>`,
        "    </news:news>",
        "  </url>",
      ].join("\n"),
    );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  return new Response(`${xml}\n`, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
}
