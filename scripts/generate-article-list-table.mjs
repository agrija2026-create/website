#!/usr/bin/env node
/**
 * 上司向け Notion 用の記事一覧 Markdown 表を stdout に出力する。
 * 使い方: node scripts/generate-article-list-table.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content/articles");

const CATEGORY = {
  policy: "政策・制度",
  budget: "予算・財政",
  market: "市場・価格・需給",
  logistics: "流通・物流",
  production: "生産・作物",
  farmland: "農地・担い手",
  technology: "技術・DX",
  "food-safety": "食品安全",
};
const AUDIENCE = new Set(["生産者向け", "小売向け", "流通向け"]);

function main() {
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  const rows = files.map((f) => {
    const { data } = matter(fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8"));
    const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const audience = tags.filter((t) => AUDIENCE.has(t));
    const theme = tags.filter((t) => !AUDIENCE.has(t));
    const slug = String(data.slug ?? path.basename(f, ".md"));
    const title = String(data.title ?? "")
      .replace(/\|/g, "｜")
      .replace(/\n/g, " ");
    return {
      publishedAt: String(data.publishedAt ?? ""),
      title,
      slug,
      category: CATEGORY[data.category] ?? data.category ?? "",
      audience: audience.join("・") || "—",
      theme: theme.join("・") || "—",
    };
  });

  rows.sort(
    (a, b) =>
      (b.publishedAt || "").localeCompare(a.publishedAt || "") ||
      a.title.localeCompare(b.title, "ja"),
  );

  console.log(`全 ${rows.length} 本（公開日の新しい順）\n`);
  console.log("| # | 公開日 | タイトル | カテゴリ | 読者 | テーマタグ |");
  console.log("| ---: | --- | --- | --- | --- | --- |");
  rows.forEach((r, i) => {
    const link = `[${r.title}](https://agri-ja.net/articles/${r.slug})`;
    console.log(
      `| ${i + 1} | ${r.publishedAt} | ${link} | ${r.category} | ${r.audience} | ${r.theme} |`,
    );
  });
}

main();
