#!/usr/bin/env node
/**
 * 公開ページ一覧（タイトル・URL・公開日）を CSV に出力する。
 * ハブページ（トップ・新着・カテゴリ・タグ）＋ content/articles/*.md の記事。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content/articles");
const OUTPUT = path.join(ROOT, "public/articles-index.csv");

/** lib/categories.ts の CATEGORY_MAP と同期 */
const CATEGORY_MAP = {
  policy: "政策・制度",
  budget: "予算・財政",
  market: "市場・価格・需給",
  logistics: "流通・物流",
  production: "生産・作物（野菜・園芸）",
  farmland: "農地・担い手・経営",
  technology: "技術・DX・スマート農業",
  "food-safety": "表示・規格・食品安全",
};

/** lib/tags.ts の READER_TAG_PATH と同期 */
const READER_TAG_PATH = {
  生産者向け: "reader-producers",
  小売向け: "reader-retail",
  流通向け: "reader-distribution",
};

/** lib/tags.ts の THEME_TAG_REGISTRY（label / urlSlug）と同期 */
const THEME_TAG_REGISTRY = [
  { label: "補助金", urlSlug: "subsidy" },
  { label: "輸出", urlSlug: "export" },
  { label: "農地バンク", urlSlug: "nouchibank" },
  { label: "金融・融資", urlSlug: "finance" },
  { label: "食品ロス", urlSlug: "food-loss" },
  { label: "流通", urlSlug: "distribution" },
  { label: "就農", urlSlug: "employment" },
  { label: "六次産業", urlSlug: "sixth-industry" },
  { label: "共同利用", urlSlug: "facility" },
  { label: "大規模化", urlSlug: "large-scale-growth-subsidy" },
  { label: "交付金", urlSlug: "direct-payment" },
  { label: "オーガニックビレッジ", urlSlug: "organic-village" },
  { label: "災害対応", urlSlug: "disaster" },
  { label: "肥料", urlSlug: "fertilizer" },
  { label: "病害虫", urlSlug: "byogaichu" },
  { label: "種苗", urlSlug: "seed" },
  { label: "ドローン", urlSlug: "drone" },
];

function siteOrigin() {
  const raw =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || "https://agri-ja.net";
  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return new URL(normalized).origin;
}

function absoluteUrl(origin, pathname) {
  return `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function escapeCsvField(value) {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function readHubPages(origin) {
  const pages = [
    {
      title: "トップページ",
      url: absoluteUrl(origin, "/"),
      publishedAt: "",
    },
    {
      title: "新着記事一覧",
      url: absoluteUrl(origin, "/recent"),
      publishedAt: "",
    },
  ];

  for (const [slug, name] of Object.entries(CATEGORY_MAP)) {
    pages.push({
      title: `カテゴリ：${name}`,
      url: absoluteUrl(origin, `/categories/${slug}`),
      publishedAt: "",
    });
  }

  for (const [label, pathSeg] of Object.entries(READER_TAG_PATH)) {
    pages.push({
      title: label,
      url: absoluteUrl(origin, `/tags/${pathSeg}`),
      publishedAt: "",
    });
  }

  for (const theme of THEME_TAG_REGISTRY) {
    pages.push({
      title: `タグ：${theme.label}`,
      url: absoluteUrl(origin, `/tags/${theme.urlSlug}`),
      publishedAt: "",
    });
  }

  return pages;
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
      return {
        title: String(d.title ?? "").trim(),
        url: "",
        slug: String(d.slug ?? "").trim(),
        publishedAt: String(d.publishedAt ?? "").trim(),
      };
    })
    .filter((a) => a.title && a.slug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

function main() {
  const origin = siteOrigin();
  const hubPages = readHubPages(origin);
  const articles = readArticles().map((a) => ({
    title: a.title,
    url: absoluteUrl(origin, `/articles/${a.slug}`),
    publishedAt: a.publishedAt,
  }));
  const rows = [...hubPages, ...articles];
  const header = ["タイトル", "URL", "公開日"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        escapeCsvField(row.title),
        escapeCsvField(row.url),
        escapeCsvField(row.publishedAt),
      ].join(","),
    ),
  ];

  const bom = "\uFEFF";
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, bom + lines.join("\n") + "\n", "utf8");

  console.log(
    `Wrote ${rows.length} pages (${hubPages.length} hub + ${articles.length} articles) to ${path.relative(ROOT, OUTPUT)}`,
  );
}

main();
