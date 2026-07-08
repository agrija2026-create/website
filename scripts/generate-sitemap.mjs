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

/*
 * カテゴリ／読者タグ／テーマタグ／index しきい値は lib/・app/ の「正本」から
 * パースして導出する（旧: ここへハードコピーしていたためドリフトでタグ欠落が発生した）。
 * 正本の書式が変わってパースに失敗した場合はビルドを落とす（サイレントなずれを防ぐ）。
 */
function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

/** `NAME ... = {` の `=` 以降で最初に現れる open から、対応する close までのブロック本文を返す（型注釈内の括弧を誤検出しないよう `=` の後から探す） */
function sliceBraceBlock(source, marker, open, close) {
  const start = source.indexOf(marker);
  if (start === -1) return null;
  const eq = source.indexOf("=", start);
  if (eq === -1) return null;
  const openIdx = source.indexOf(open, eq);
  if (openIdx === -1) return null;
  let depth = 0;
  for (let i = openIdx; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    else if (source[i] === close) {
      depth -= 1;
      if (depth === 0) return source.slice(openIdx + 1, i);
    }
  }
  return null;
}

/** lib/categories.ts の CATEGORY_MAP からカテゴリ slug を導出 */
function loadCategorySlugs() {
  const src = readSource("lib/categories.ts");
  const block = sliceBraceBlock(src, "const CATEGORY_MAP", "{", "}");
  if (!block) throw new Error("generate-sitemap: CATEGORY_MAP を解析できません");
  const slugs = [];
  const re = /(?:"([^"]+)"|([A-Za-z0-9-]+))\s*:/g;
  let m;
  while ((m = re.exec(block))) slugs.push(m[1] ?? m[2]);
  if (slugs.length === 0)
    throw new Error("generate-sitemap: カテゴリ slug が空です");
  return slugs;
}

/** lib/tags.ts の READER_TAG_PATH から 日本語ラベル→URL セグメント を導出 */
function loadReaderTagPath() {
  const src = readSource("lib/tags.ts");
  const block = sliceBraceBlock(src, "const READER_TAG_PATH", "{", "}");
  if (!block) throw new Error("generate-sitemap: READER_TAG_PATH を解析できません");
  const map = {};
  const re = /([^\s:,{}]+)\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(block))) map[m[1].replace(/"/g, "")] = m[2];
  if (Object.keys(map).length === 0)
    throw new Error("generate-sitemap: 読者タグが空です");
  return map;
}

/** lib/tags.ts の THEME_TAG_REGISTRY から 日本語ラベル→urlSlug を導出 */
function loadThemeTagUrlSlug() {
  const src = readSource("lib/tags.ts");
  const block = sliceBraceBlock(src, "const THEME_TAG_REGISTRY", "[", "]");
  if (!block) throw new Error("generate-sitemap: THEME_TAG_REGISTRY を解析できません");
  const map = {};
  const re = /label:\s*"([^"]+)"\s*,\s*urlSlug:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(block))) map[m[1]] = m[2];
  if (Object.keys(map).length === 0)
    throw new Error("generate-sitemap: テーマタグが空です");
  return map;
}

/** app/tags/[slug]/page.tsx の MIN_INDEXABLE_THEME_TAG_ARTICLES を導出 */
function loadMinIndexableThemeTagArticles() {
  const src = readSource("app/tags/[slug]/page.tsx");
  const m = src.match(/MIN_INDEXABLE_THEME_TAG_ARTICLES\s*=\s*(\d+)/);
  if (!m)
    throw new Error(
      "generate-sitemap: MIN_INDEXABLE_THEME_TAG_ARTICLES を解析できません",
    );
  return Number(m[1]);
}

const CATEGORY_SLUGS = loadCategorySlugs();
const READER_TAG_PATH = loadReaderTagPath();
const AUDIENCE_TAG_PATHS = new Set(Object.values(READER_TAG_PATH));
const THEME_TAG_URLSLUG = loadThemeTagUrlSlug();
const MIN_INDEXABLE_THEME_TAG_ARTICLES = loadMinIndexableThemeTagArticles();

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
        updatedAt: String(d.updatedAt ?? "").trim(),
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

/** index 解放されるテーマタグ（記事 N 本以上）の URL セグメントを返す */
function collectThemeTagPaths(articles) {
  const counts = new Map();
  for (const article of articles) {
    for (const tag of article.tags) {
      const slug = THEME_TAG_URLSLUG[tag];
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n >= MIN_INDEXABLE_THEME_TAG_ARTICLES)
    .map(([slug]) => slug)
    .sort((a, b) => a.localeCompare(b, "ja"));
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
  const themeTagPaths = collectThemeTagPaths(articles);
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

  for (const slug of themeTagPaths) {
    entries.push(
      urlEntry({
        origin,
        loc: absoluteUrl(origin, `/tags/${slug}`),
        changefreq: "weekly",
        priority: 0.6,
      }),
    );
  }

  for (const article of articles) {
    entries.push(
      urlEntry({
        origin,
        loc: absoluteUrl(origin, `/articles/${article.slug}`),
        lastmod: formatLastmod(article.updatedAt || article.publishedAt),
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
