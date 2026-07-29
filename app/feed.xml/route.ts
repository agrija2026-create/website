import { getAllArticles } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import { getTagLabel } from "@/lib/tags";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL_ORIGIN,
  absoluteUrl,
} from "@/lib/site";

export const dynamic = "force-static";

/** フィードに載せる最新記事の本数（RSSリーダーの初回取り込み量を抑える） */
const FEED_ITEM_LIMIT = 30;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const RFC822_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RFC822_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * frontmatter の日付（"2026-07-28" 等）を RSS の pubDate 形式（RFC822）にする。
 * 日付のみの指定は JST の 0 時とみなす。解釈できない値は空文字（pubDate を出さない）。
 */
function toRfc822(dateLike: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateLike)
    ? `${dateLike}T00:00:00+09:00`
    : dateLike;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "";

  // JST 表記で出力する（+0900）
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    `${RFC822_DAYS[jst.getUTCDay()]},`,
    pad(jst.getUTCDate()),
    RFC822_MONTHS[jst.getUTCMonth()],
    jst.getUTCFullYear(),
    `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}:${pad(jst.getUTCSeconds())}`,
    "+0900",
  ].join(" ");
}

/** 説明文＋「この記事でわかること」を、リーダー表示用の簡単な HTML にする */
function buildItemDescription(
  description: string,
  takeaways: string[],
): string {
  const parts = [`<p>${escapeXml(description)}</p>`];
  if (takeaways.length > 0) {
    const items = takeaways
      .map((t) => `<li>${escapeXml(t)}</li>`)
      .join("");
    parts.push(`<p><strong>この記事でわかること</strong></p><ul>${items}</ul>`);
  }
  return parts.join("");
}

/**
 * /feed.xml — 新着記事の RSS 2.0 フィード。
 * 全文ではなく説明＋「この記事でわかること」を配信し、本文はサイトで読んでもらう。
 */
export async function GET() {
  const articles = (await getAllArticles()).slice(0, FEED_ITEM_LIMIT);

  // ビルドのたびに変わらないよう、最新記事の日付を lastBuildDate に使う
  const latest = articles[0];
  const lastBuildDate = latest
    ? toRfc822(latest.updatedAt ?? latest.publishedAt)
    : "";

  const items = articles
    .map((a) => {
      const url = absoluteUrl(`/articles/${a.slug}`);
      const pubDate = toRfc822(a.publishedAt);
      const categories = [
        getCategoryName(a.category),
        ...a.themeTags.map(getTagLabel),
      ]
        .filter(Boolean)
        .map((c) => `      <category>${escapeXml(c)}</category>`)
        .join("\n");

      return [
        "    <item>",
        `      <title>${escapeXml(a.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
        `      <description><![CDATA[${buildItemDescription(
          a.description,
          a.takeaways,
        )}]]></description>`,
        categories,
      ]
        .filter(Boolean)
        .concat("    </item>")
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${escapeXml(SITE_URL_ORIGIN)}/</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    "    <language>ja</language>",
    lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : "",
    `    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />`,
    "    <ttl>60</ttl>",
    items,
    "  </channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");

  return new Response(`${xml}\n`, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
