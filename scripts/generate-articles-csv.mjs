#!/usr/bin/env node
/**
 * 公開記事一覧（タイトル・URL・公開日）を CSV に出力する。
 * content/articles/*.md の frontmatter を読み取る。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content/articles");
const OUTPUT = path.join(ROOT, "public/articles-index.csv");

function siteOrigin() {
  const raw =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || "https://agri-ja.net";
  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return new URL(normalized).origin;
}

function escapeCsvField(value) {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
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
  const rows = readArticles();
  const header = ["タイトル", "URL", "公開日"];
  const lines = [
    header.join(","),
    ...rows.map((a) =>
      [
        escapeCsvField(a.title),
        escapeCsvField(`${origin}/articles/${a.slug}`),
        escapeCsvField(a.publishedAt),
      ].join(","),
    ),
  ];

  const bom = "\uFEFF";
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, bom + lines.join("\n") + "\n", "utf8");

  console.log(`Wrote ${rows.length} articles to ${path.relative(ROOT, OUTPUT)}`);
}

main();
