#!/usr/bin/env node
/**
 * public/sitemap.xml を content/articles/*.md から生成する。
 * app/sitemap.ts（動的）の代替。build / article:publish 時に実行。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content/articles");
const OUTPUT = path.join(ROOT, "public/sitemap.xml");

/** lib/categories.ts の CATEGORY_SLUGS と同期 */
const CATEGORY_SLUGS = [
  "policy",
  "budget",
  "market",
  "logistics",
  "production",
  "farmland",
  "technology",
  "food-safety",
];

/** lib/tags.ts の READER_TAG_PATH と同期 */
const READER_TAG_PATH = {
  生産者向け: "reader-producers",
  小売向け: "reader-retail",
  流通向け: "reader-distribution",
};

const AUDIENCE_TAG_PATHS = new Set(Object.values(READER_TAG_PATH));

function siteOrigin() {
  const raw =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || "https://agri-ja.net";
  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return new URL(normalized).origin;
}

function absoluteUrl(origin, pathname) {
  return `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(publishedAt) {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function readArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8");
      const { data } = matter(raw);
      const d = data ?? {};
      const tagsRaw = d.tags;
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map(String)
        : typeof tagsRaw === "string"
          ? [tagsRaw]
          : [];

      return {
        slug: String(d.slug ?? "").trim(),
        publishedAt: String(d.publishedAt ?? "").trim(),
        tags,
      };
    })
    .filter((a) => a.slug);
}

function collectAudienceTagPaths(articles) {
  const paths = new Set();
  for (const article of articles) {
    for (const tag of article.tags) {
      const segment = READER_TAG_PATH[tag];
      if (segment && AUDIENCE_TAG_PATHS.has(segment)) {
        paths.add(segment);
      }
    }
  }
  return Array.from(paths).sort((a, b) => a.localeCompare(b, "ja"));
}

function urlEntry({ origin, loc, changefreq, priority, lastmod }) {
  const lines = ["<url>", `<loc>${escapeXml(loc)}</loc>`];
  if (lastmod) {
    lines.push(`<lastmod>${escapeXml(lastmod)}</lastmod>`);
  }
  if (changefreq) {
    lines.push(`<changefreq>${escapeXml(changefreq)}</changefreq>`);
  }
  if (priority != null) {
    lines.push(`<priority>${priority}</priority>`);
  }
  lines.push("</url>");
  return lines.join("\n");
}

function main() {
  const origin = siteOrigin();
  const articles = readArticles();
  const tagPaths = collectAudienceTagPaths(articles);
  const entries = [];

  entries.push(
    urlEntry({
      origin,
      loc: absoluteUrl(origin, "/"),
      changefreq: "daily",
      priority: 1,
    }),
  );
  entries.push(
    urlEntry({
      origin,
      loc: absoluteUrl(origin, "/recent"),
      changefreq: "daily",
      priority: 0.8,
    }),
  );

  for (const slug of CATEGORY_SLUGS) {
    entries.push(
      urlEntry({
        origin,
        loc: absoluteUrl(origin, `/categories/${slug}`),
        changefreq: "weekly",
        priority: 0.9,
      }),
    );
  }

  for (const slug of tagPaths) {
    entries.push(
      urlEntry({
        origin,
        loc: absoluteUrl(origin, `/tags/${slug}`),
        changefreq: "weekly",
        priority: 0.7,
      }),
    );
  }

  for (const article of articles) {
    entries.push(
      urlEntry({
        origin,
        loc: absoluteUrl(origin, `/articles/${article.slug}`),
        lastmod: formatLastmod(article.publishedAt),
        changefreq: "monthly",
        priority: 0.8,
      }),
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, xml, "utf8");

  console.log(
    `Wrote sitemap (${entries.length} URLs) to ${path.relative(ROOT, OUTPUT)}`,
  );
}

main();
